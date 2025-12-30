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
        // Look for coordinates in various formats
        let latitude: number | null = null;
        let longitude: number | null = null;
        let speed: number | null = null;
        let course: number | null = null;
        let name: string | null = null;
        let destination: string | null = null;
        let status: string | null = null;

        // Try to find coordinates from script tags (map initialization data)
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const content = script.textContent || '';
          // Look for lat/lon in JSON data or variable assignments
          const latMatch = /["']?(?:lat|latitude)["']?\s*[:=]\s*(-?\d+\.\d+)/i.exec(content);
          const lonMatch = /["']?(?:lon|lng|longitude)["']?\s*[:=]\s*(-?\d+\.\d+)/i.exec(content);
          if (latMatch && lonMatch) {
            latitude = Number.parseFloat(latMatch[1]);
            longitude = Number.parseFloat(lonMatch[1]);
            break;
          }
          // Look for coordinates array [lat, lon]
          const coordArrayMatch = /center["']?\s*[:=]\s*\[(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\]/i.exec(content);
          if (coordArrayMatch) {
            latitude = Number.parseFloat(coordArrayMatch[1]);
            longitude = Number.parseFloat(coordArrayMatch[2]);
            break;
          }
        }

        // Try to find coordinates from data attributes
        if (!latitude || !longitude) {
          const mapEl = document.querySelector('[data-lat][data-lon], [data-latitude][data-longitude]');
          if (mapEl) {
            const lat = mapEl.getAttribute('data-lat') || mapEl.getAttribute('data-latitude');
            const lon = mapEl.getAttribute('data-lon') || mapEl.getAttribute('data-longitude');
            if (lat && lon) {
              latitude = Number.parseFloat(lat);
              longitude = Number.parseFloat(lon);
            }
          }
        }

        // Try to find data from the page content
        const pageText = document.body.innerText;

        // Try multiple coordinate formats
        // Format 1: 41.00734° N / 2.76506° E
        const coordRegex1 = /(-?\d+\.?\d*)°?\s*([NS])\s*[/,]\s*(-?\d+\.?\d*)°?\s*([EW])/i;
        // Format 2: Position: 41.00734, 2.76506 or Coordinates: 41.00734, 2.76506
        const coordRegex2 = /(?:Position|Coordinates|Lat\/?Lon)[:\s]+(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/i;
        // Format 3: Latitude: 41.00734 ... Longitude: 2.76506
        const coordRegex3 = /Latitude[:\s]+(-?\d+\.\d+).*?Longitude[:\s]+(-?\d+\.\d+)/is;
        // Format 4: 41° 0.44' N, 2° 45.90' E (degrees and minutes)
        const coordRegex4 = /(\d+)°\s*(\d+\.?\d*)[''′]\s*([NS])[,\s]+(\d+)°\s*(\d+\.?\d*)[''′]\s*([EW])/i;

        let coordMatch = coordRegex1.exec(pageText);
        if (coordMatch) {
          latitude = Number.parseFloat(coordMatch[1]) * (coordMatch[2].toUpperCase() === 'S' ? -1 : 1);
          longitude = Number.parseFloat(coordMatch[3]) * (coordMatch[4].toUpperCase() === 'W' ? -1 : 1);
        }

        if (!latitude || !longitude) {
          coordMatch = coordRegex2.exec(pageText);
          if (coordMatch) {
            latitude = Number.parseFloat(coordMatch[1]);
            longitude = Number.parseFloat(coordMatch[2]);
          }
        }

        if (!latitude || !longitude) {
          coordMatch = coordRegex3.exec(pageText);
          if (coordMatch) {
            latitude = Number.parseFloat(coordMatch[1]);
            longitude = Number.parseFloat(coordMatch[2]);
          }
        }

        if (!latitude || !longitude) {
          coordMatch = coordRegex4.exec(pageText);
          if (coordMatch) {
            const latDeg = Number.parseFloat(coordMatch[1]);
            const latMin = Number.parseFloat(coordMatch[2]);
            latitude = (latDeg + latMin / 60) * (coordMatch[3].toUpperCase() === 'S' ? -1 : 1);
            const lonDeg = Number.parseFloat(coordMatch[4]);
            const lonMin = Number.parseFloat(coordMatch[5]);
            longitude = (lonDeg + lonMin / 60) * (coordMatch[6].toUpperCase() === 'W' ? -1 : 1);
          }
        }

        // Parse course and speed (format: "Course / Speed 218° / 10.5 kn" or "218° / 10.5 kn")
        const courseSpeedRegex = /(\d+\.?\d*)°\s*\/\s*(\d+\.?\d*)\s*kn/i;
        const courseSpeedMatch = courseSpeedRegex.exec(pageText);
        if (courseSpeedMatch) {
          course = Number.parseFloat(courseSpeedMatch[1]);
          speed = Number.parseFloat(courseSpeedMatch[2]);
        }

        // Fallback: Parse speed separately (format: Speed: 10.4 kn or similar)
        if (!speed) {
          const speedRegex = /Speed[:\s]+(\d+\.?\d*)\s*(?:kn|knots)/i;
          const speedMatch = speedRegex.exec(pageText);
          if (speedMatch) {
            speed = Number.parseFloat(speedMatch[1]);
          }
        }

        // Fallback: Parse course separately (format: Course: 218° or COG: 218°)
        if (!course) {
          const courseRegex = /(?:Course|COG)[:\s]+(\d+\.?\d*)°?/i;
          const courseMatch = courseRegex.exec(pageText);
          if (courseMatch) {
            course = Number.parseFloat(courseMatch[1]);
          }
        }

        // Find vessel name from first line or h1 element
        const firstLineMatch = /^([A-Z][A-Z\s]+)$/m.exec(pageText);
        if (firstLineMatch) {
          name = firstLineMatch[1].trim();
        } else {
          const nameEl = document.querySelector('h1');
          const nameText = nameEl?.textContent?.trim();
          if (nameText && !nameText.toLowerCase().includes('consent')) {
            name = nameText.split(',')[0].trim();
          }
        }

        // Find destination
        const destRegex = /Destination[:\s]+([A-Z0-9\s,]+?)(?:\n|$|ETA)/i;
        const destMatch = destRegex.exec(pageText);
        if (destMatch) {
          destination = destMatch[1].trim();
        }

        // Find status
        const statusRegex = /(?:Status|Nav\.?\s*Status)[:\s]+([a-z\s]+?)(?:\n|$|Speed)/i;
        const statusMatch = statusRegex.exec(pageText);
        if (statusMatch) {
          status = statusMatch[1].trim();
        }

        // Extract a sample of page text for debugging
        const textSample = pageText.slice(0, 1000);

        return {
          latitude,
          longitude,
          speed,
          course,
          name,
          destination,
          status,
          pageTitle: document.title,
          url: window.location.href,
          textSample,
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
        const fs = await import('fs');
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
