import puppeteer from 'puppeteer';
import { PositionRepository } from '../repositories/PositionRepository';
import { EPositionReportType } from 'shared';
import type { IPosition } from 'shared';

const VESSELFINDER_URL = 'https://www.vesselfinder.com';

interface ScrapedVesselData {
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  heading?: number;
  destination?: string;
  eta?: string;
  name?: string;
  status?: string;
  lastReport?: string;
}

export class VesselFinderScraperService {
  private readonly positionRepository: PositionRepository;
  private readonly mmsi: string;

  constructor(positionRepository: PositionRepository, mmsi: string) {
    this.positionRepository = positionRepository;
    this.mmsi = mmsi;
  }

  async getVesselPosition(): Promise<void> {
    console.log(`Scraping VesselFinder for MMSI: ${this.mmsi}`);

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

      // Intercept network requests to capture API responses with position data
      let apiLatitude: number | null = null;
      let apiLongitude: number | null = null;

      await page.setRequestInterception(true);
      page.on('request', (request) => {
        request.continue();
      });

      page.on('response', async (response) => {
        const responseUrl = response.url();
        try {
          const text = await response.text();
          // Look for coordinates in any response
          const latMatch = /"lat(?:itude)?":\s*(-?\d+\.\d+)/i.exec(text);
          const lonMatch = /"(?:lon|lng|longitude)":\s*(-?\d+\.\d+)/i.exec(text);
          if (latMatch && lonMatch && !apiLatitude) {
            apiLatitude = Number.parseFloat(latMatch[1]);
            apiLongitude = Number.parseFloat(lonMatch[1]);
            console.log(`Found coordinates in response ${responseUrl}: ${apiLatitude}, ${apiLongitude}`);
          }
          // Also try AIS-style format: "A":lat,"O":lon
          const aisLatMatch = /"A":\s*(-?\d+\.\d+)/i.exec(text);
          const aisLonMatch = /"O":\s*(-?\d+\.\d+)/i.exec(text);
          if (aisLatMatch && aisLonMatch && !apiLatitude) {
            apiLatitude = Number.parseFloat(aisLatMatch[1]);
            apiLongitude = Number.parseFloat(aisLonMatch[1]);
            console.log(`Found AIS coordinates in response: ${apiLatitude}, ${apiLongitude}`);
          }
        } catch {
          // Ignore response parsing errors
        }
      });

      // Navigate to VesselFinder vessel details page
      const url = `${VESSELFINDER_URL}/vessels/details/${this.mmsi}`;
      console.log(`Navigating to: ${url}`);

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      // Handle cookie consent dialog
      try {
        const consentButton = await page.waitForSelector(
          'button.fc-cta-consent, button[aria-label="Consent"], .fc-button.fc-cta-consent, button.css-47sehv',
          { timeout: 5000 }
        );
        if (consentButton) {
          console.log('Clicking consent button...');
          await consentButton.click();
          await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});
        }
      } catch {
        console.log('No consent dialog found or already accepted');
      }

      // Wait for vessel data to load
      await page.waitForSelector('.MuiPaper-root, .ship-info, [class*="Position"]', { timeout: 10000 }).catch(() => {
        console.log('Waiting for page content...');
      });

      // Give the page a moment to fully render
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try clicking on "Details" link to reveal more data
      try {
        const detailsLink = await page.$('a:has-text("Details"), button:has-text("Details"), [class*="details"]');
        if (detailsLink) {
          console.log('Clicking Details link...');
          await detailsLink.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch {
        console.log('Could not find/click Details link');
      }

      // Get full HTML to search for embedded coordinates
      const pageHtml = await page.content();

      // Search HTML for coordinate patterns
      const htmlLatMatch = /["']lat(?:itude)?["']:\s*(-?\d+\.\d+)/i.exec(pageHtml);
      const htmlLonMatch = /["'](?:lon|lng|longitude)["']:\s*(-?\d+\.\d+)/i.exec(pageHtml);
      if (htmlLatMatch && htmlLonMatch && !apiLatitude) {
        apiLatitude = Number.parseFloat(htmlLatMatch[1]);
        apiLongitude = Number.parseFloat(htmlLonMatch[1]);
        console.log(`Found coordinates in HTML: ${apiLatitude}, ${apiLongitude}`);
      }

      // Try to find coordinates in data attributes or map initialization
      const dataLatMatch = /data-lat(?:itude)?=["'](-?\d+\.\d+)["']/i.exec(pageHtml);
      const dataLonMatch = /data-(?:lon|lng|longitude)=["'](-?\d+\.\d+)["']/i.exec(pageHtml);
      if (dataLatMatch && dataLonMatch && !apiLatitude) {
        apiLatitude = Number.parseFloat(dataLatMatch[1]);
        apiLongitude = Number.parseFloat(dataLonMatch[1]);
        console.log(`Found coordinates in data attributes: ${apiLatitude}, ${apiLongitude}`);
      }

      // Look for map center coordinates
      const centerMatch = /center['"]*:\s*\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/i.exec(pageHtml);
      if (centerMatch && !apiLatitude) {
        apiLatitude = Number.parseFloat(centerMatch[1]);
        apiLongitude = Number.parseFloat(centerMatch[2]);
        console.log(`Found map center coordinates: ${apiLatitude}, ${apiLongitude}`);
      }

      // Extract vessel data from the page
      const vesselData = await page.evaluate(() => {
        type Coordinates = { latitude: number; longitude: number } | null;

        // Helper: Extract coordinates from script tags
        function extractCoordsFromScripts(): Coordinates {
          const scripts = document.querySelectorAll('script');
          for (const script of scripts) {
            const content = script.textContent || '';
            const latMatch = /["']?(?:lat|latitude)["']?\s*[:=]\s*(-?\d+\.\d+)/i.exec(content);
            const lonMatch = /["']?(?:lon|lng|longitude)["']?\s*[:=]\s*(-?\d+\.\d+)/i.exec(content);
            if (latMatch && lonMatch) {
              return { latitude: Number.parseFloat(latMatch[1]), longitude: Number.parseFloat(lonMatch[1]) };
            }
            const coordArrayMatch = /center["']?\s*[:=]\s*\[(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\]/i.exec(content);
            if (coordArrayMatch) {
              return { latitude: Number.parseFloat(coordArrayMatch[1]), longitude: Number.parseFloat(coordArrayMatch[2]) };
            }
          }
          return null;
        }

        // Helper: Extract coordinates from data attributes
        function extractCoordsFromDataAttrs(): Coordinates {
          const mapEl = document.querySelector('[data-lat][data-lon], [data-latitude][data-longitude]') as HTMLElement | null;
          if (mapEl?.dataset) {
            const lat = mapEl.dataset.lat ?? mapEl.dataset.latitude;
            const lon = mapEl.dataset.lon ?? mapEl.dataset.longitude;
            if (lat && lon) {
              return { latitude: Number.parseFloat(lat), longitude: Number.parseFloat(lon) };
            }
          }
          return null;
        }

        // Helper: Extract coordinates from page text
        function extractCoordsFromText(pageText: string): Coordinates {
          // Format 1: 41.00734° N / 2.76506° E
          const match1 = /(-?\d+\.?\d*)°?\s*([NS])\s*[/,]\s*(-?\d+\.?\d*)°?\s*([EW])/i.exec(pageText);
          if (match1) {
            return {
              latitude: Number.parseFloat(match1[1]) * (match1[2].toUpperCase() === 'S' ? -1 : 1),
              longitude: Number.parseFloat(match1[3]) * (match1[4].toUpperCase() === 'W' ? -1 : 1),
            };
          }
          // Format 2: Position: 41.00734, 2.76506
          const match2 = /(?:Position|Coordinates|Lat\/?Lon)[:\s]+(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/i.exec(pageText);
          if (match2) {
            return { latitude: Number.parseFloat(match2[1]), longitude: Number.parseFloat(match2[2]) };
          }
          // Format 3: Latitude: 41.00734 ... Longitude: 2.76506
          const match3 = /Latitude[:\s]+(-?\d+\.\d+).*?Longitude[:\s]+(-?\d+\.\d+)/is.exec(pageText);
          if (match3) {
            return { latitude: Number.parseFloat(match3[1]), longitude: Number.parseFloat(match3[2]) };
          }
          // Format 4: 41° 0.44' N, 2° 45.90' E (degrees and minutes)
          const match4 = /(\d+)°\s*(\d+\.?\d*)['′]\s*([NS])[,\s]+(\d+)°\s*(\d+\.?\d*)['′]\s*([EW])/i.exec(pageText);
          if (match4) {
            const latDeg = Number.parseFloat(match4[1]);
            const latMin = Number.parseFloat(match4[2]);
            const lonDeg = Number.parseFloat(match4[4]);
            const lonMin = Number.parseFloat(match4[5]);
            return {
              latitude: (latDeg + latMin / 60) * (match4[3].toUpperCase() === 'S' ? -1 : 1),
              longitude: (lonDeg + lonMin / 60) * (match4[6].toUpperCase() === 'W' ? -1 : 1),
            };
          }
          return null;
        }

        // Helper: Extract course and speed
        function extractCourseSpeed(pageText: string): { course: number | null; speed: number | null } {
          let course: number | null = null;
          let speed: number | null = null;
          const courseSpeedMatch = /(\d+\.?\d*)°\s*\/\s*(\d+\.?\d*)\s*kn/i.exec(pageText);
          if (courseSpeedMatch) {
            course = Number.parseFloat(courseSpeedMatch[1]);
            speed = Number.parseFloat(courseSpeedMatch[2]);
          }
          if (!speed) {
            const speedMatch = /Speed[:\s]+(\d+\.?\d*)\s*(?:kn|knots)/i.exec(pageText);
            if (speedMatch) speed = Number.parseFloat(speedMatch[1]);
          }
          if (!course) {
            const courseMatch = /(?:Course|COG)[:\s]+(\d+\.?\d*)°?/i.exec(pageText);
            if (courseMatch) course = Number.parseFloat(courseMatch[1]);
          }
          return { course, speed };
        }

        // Helper: Extract vessel name
        function extractName(pageText: string): string | null {
          const firstLineMatch = /^([A-Z][A-Z\s]+)$/m.exec(pageText);
          if (firstLineMatch) return firstLineMatch[1].trim();
          const nameEl = document.querySelector('h1');
          const nameText = nameEl?.textContent?.trim();
          if (nameText && !nameText.toLowerCase().includes('consent')) {
            return nameText.split(',')[0].trim();
          }
          return null;
        }

        // Helper: Extract destination and status
        function extractDestinationStatus(pageText: string): { destination: string | null; status: string | null } {
          const destMatch = /Destination[:\s]+([A-Z0-9\s,]+?)(?:\n|$|ETA)/i.exec(pageText);
          const statusMatch = /(?:Status|Nav\.?\s*Status)[:\s]+([a-z\s]+?)(?:\n|$|Speed)/i.exec(pageText);
          return {
            destination: destMatch ? destMatch[1].trim() : null,
            status: statusMatch ? statusMatch[1].trim() : null,
          };
        }

        // Main extraction logic
        const pageText = document.body.innerText;
        const coords = extractCoordsFromScripts() ?? extractCoordsFromDataAttrs() ?? extractCoordsFromText(pageText);
        const { course, speed } = extractCourseSpeed(pageText);
        const name = extractName(pageText);
        const { destination, status } = extractDestinationStatus(pageText);

        return {
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
          speed,
          course,
          name,
          destination,
          status,
          pageTitle: document.title,
          url: window.location.href,
          textSample: pageText.slice(0, 1000),
        };
      });

      // Use API coordinates if page scraping didn't find them
      if ((!vesselData.latitude || !vesselData.longitude) && apiLatitude && apiLongitude) {
        vesselData.latitude = apiLatitude;
        vesselData.longitude = apiLongitude;
        console.log('Using coordinates from API interception');
      }

      console.log('Scraped data:', JSON.stringify(vesselData, null, 2));

      if (!vesselData.latitude || !vesselData.longitude) {
        console.error('Could not extract coordinates from page');
        console.log('Page title:', vesselData.pageTitle);
        console.log('Page URL:', vesselData.url);

        // Take a screenshot for debugging
        // await page.screenshot({ path: '/tmp/vesselfinder-debug.png', fullPage: true });
        // console.log('Debug screenshot saved to /tmp/vesselfinder-debug.png');

        // Save HTML for debugging
        const fs = await import('node:fs');
        fs.writeFileSync('/tmp/vesselfinder-debug.html', pageHtml);
        console.log('Debug HTML saved to /tmp/vesselfinder-debug.html');
        return;
      }

      const positionData: Omit<IPosition, 'id'> = {
        mmsi: Number.parseInt(this.mmsi, 10),
        latitude: vesselData.latitude,
        longitude: vesselData.longitude,
        positionTimeMetaData: new Date().toISOString(),
        cog: vesselData.course ?? undefined,
        sog: vesselData.speed ?? undefined,
        positionReportType: EPositionReportType.VesselFinderScrape,
        name: vesselData.name ?? undefined,
        destination: vesselData.destination ?? undefined,
      };

      console.log(`\nSaving position from VesselFinder:`);
      console.log(`  MMSI:        ${positionData.mmsi}`);
      console.log(`  Name:        ${positionData.name}`);
      console.log(`  Latitude:    ${positionData.latitude}`);
      console.log(`  Longitude:   ${positionData.longitude}`);
      console.log(`  COG:         ${positionData.cog}`);
      console.log(`  SOG:         ${positionData.sog}`);
      console.log(`  Destination: ${positionData.destination}`);

      this.positionRepository.save(positionData);

    } catch (error) {
      console.error('Error scraping VesselFinder:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }
}
