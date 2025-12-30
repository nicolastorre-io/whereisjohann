import puppeteer from 'puppeteer';
import { PositionRepository } from '../repositories/PositionRepository';
import { EPositionReportType } from 'shared';
import type { IPosition } from 'shared';

const MYSHIPTRACKING_URL = 'https://www.myshiptracking.com';

interface ScrapedVesselData {
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  course: number | null;
  heading?: number;
  destination?: string;
  name?: string;
  status?: string;
}

export class MyShipTrackingScraperService {
  private readonly positionRepository: PositionRepository;
  private readonly mmsi: string;

  constructor(positionRepository: PositionRepository, mmsi: string) {
    this.positionRepository = positionRepository;
    this.mmsi = mmsi;
  }

  async getVesselPosition(): Promise<void> {
    console.log(`Scraping MyShipTracking for MMSI: ${this.mmsi}`);

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        `--user-agent=${userAgent}`,
      ],
    });

    try {
      const page = await browser.newPage();

      // Navigate to MyShipTracking vessel page
      const url = `${MYSHIPTRACKING_URL}/vessels/mmsi-${this.mmsi}`;
      console.log(`Navigating to: ${url}`);

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      // Handle cookie consent if present
      try {
        const consentButton = await page.waitForSelector(
          'button[id*="accept"], button[class*="accept"], .cookie-accept, #onetrust-accept-btn-handler',
          { timeout: 5000 }
        );
        if (consentButton) {
          console.log('Clicking consent button...');
          await consentButton.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch {
        console.log('No consent dialog found');
      }

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Extract vessel data from the page
      const vesselData = await page.evaluate(() => {
        const pageText = document.body.innerText;

        // Extract coordinates
        let latitude: number | null = null;
        let longitude: number | null = null;

        // Format 1: Look for "coordinates X° / Y°" pattern in description text
        const coordDescMatch = /coordinates\s+(-?\d+\.\d+)°?\s*[/,]\s*(-?\d+\.\d+)°?/i.exec(pageText);
        if (coordDescMatch) {
          latitude = Number.parseFloat(coordDescMatch[1]);
          longitude = Number.parseFloat(coordDescMatch[2]);
        }

        // Format 2: Look for "position ... is ... X° / Y°" pattern
        if (!latitude || !longitude) {
          const posMatch = /position[^]*?(\d+\.\d+)°\s*[/,]\s*(\d+\.\d+)°/i.exec(pageText);
          if (posMatch) {
            latitude = Number.parseFloat(posMatch[1]);
            longitude = Number.parseFloat(posMatch[2]);
          }
        }

        // Format 3: Look for labeled coordinates (Latitude: X, Longitude: Y)
        if (!latitude || !longitude) {
          const latMatch = /Latitude[:\s]+(-?\d+\.\d+)°?/i.exec(pageText);
          const lonMatch = /Longitude[:\s]+(-?\d+\.\d+)°?/i.exec(pageText);
          if (latMatch && lonMatch) {
            latitude = Number.parseFloat(latMatch[1]);
            longitude = Number.parseFloat(lonMatch[1]);
          }
        }

        // Extract speed
        let speed: number | null = null;
        const speedMatch = /Speed[:\s]+(\d+\.?\d*)\s*(?:kn|knots)/i.exec(pageText);
        if (speedMatch) {
          speed = Number.parseFloat(speedMatch[1]);
        }

        // Extract course
        let course: number | null = null;
        const courseMatch = /Course[:\s]+(\d+\.?\d*)°?/i.exec(pageText);
        if (courseMatch) {
          course = Number.parseFloat(courseMatch[1]);
        }

        // Extract vessel name from h1 or title
        let name: string | null = null;
        const h1 = document.querySelector('h1');
        if (h1?.textContent) {
          name = h1.textContent.trim().split(/[-–]/)[0].trim();
        }

        // Extract destination code (e.g., ESALC) - appears after destination name before ETA
        let destination: string | null = null;
        const destMatch = /\n([A-Z]{5,6})\nETA/i.exec(pageText);
        if (destMatch) {
          destination = destMatch[1].trim();
        }

        // Extract ETA - format: "ETA*\n2025-12-31 07:00 (UTC)"
        let eta: number | null = null;
        const etaMatch = /ETA\*?\s*\n?\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*\(UTC\)/i.exec(pageText);
        if (etaMatch) {
          const etaDate = new Date(`${etaMatch[1]}T${etaMatch[2]}:00Z`);
          eta = etaDate.getTime(); // milliseconds, consistent with AISStream
        }

        // Extract position report time - format: "as reported on 2025-12-30 10:22 by AIS"
        let positionTime: string | null = null;
        const posTimeMatch = /reported on\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/i.exec(pageText);
        if (posTimeMatch) {
          positionTime = `${posTimeMatch[1]}T${posTimeMatch[2]}:00Z`;
        }

        // Extract status
        let status: string | null = null;
        const statusMatch = /Status[:\s]+["']?([A-Za-z\s]+?)["']?(?:\n|$|Draught)/i.exec(pageText);
        if (statusMatch) {
          status = statusMatch[1].trim();
        }

        return {
          latitude,
          longitude,
          speed,
          course,
          name,
          destination,
          eta,
          positionTime,
          status,
          pageTitle: document.title,
          url: window.location.href,
          textSample: pageText.slice(0, 1500),
        };
      });

      console.log('Scraped data:', JSON.stringify(vesselData, null, 2));

      if (!vesselData.latitude || !vesselData.longitude) {
        console.error('Could not extract coordinates from page');
        console.log('Page title:', vesselData.pageTitle);
        console.log('Text sample:', vesselData.textSample);
        return;
      }

      const positionData: Omit<IPosition, 'id'> = {
        mmsi: Number.parseInt(this.mmsi, 10),
        latitude: vesselData.latitude,
        longitude: vesselData.longitude,
        positionTimeMetaData: vesselData.positionTime ?? new Date().toISOString(),
        cog: vesselData.course ?? undefined,
        sog: vesselData.speed ?? undefined,
        positionReportType: EPositionReportType.MyShipTrackingScrape,
        name: vesselData.name ?? undefined,
        destination: vesselData.destination ?? undefined,
        eta: vesselData.eta ?? undefined,
      };

      console.log(`\nSaving position from MyShipTracking:`);
      console.log(`  MMSI:        ${positionData.mmsi}`);
      console.log(`  Name:        ${positionData.name}`);
      console.log(`  Latitude:    ${positionData.latitude}`);
      console.log(`  Longitude:   ${positionData.longitude}`);
      console.log(`  COG:         ${positionData.cog}`);
      console.log(`  SOG:         ${positionData.sog}`);
      console.log(`  Destination: ${positionData.destination}`);
      console.log(`  ETA:         ${positionData.eta ? new Date(positionData.eta).toISOString() : 'N/A'}`);

      this.positionRepository.save(positionData);

    } catch (error) {
      console.error('Error scraping MyShipTracking:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }
}
