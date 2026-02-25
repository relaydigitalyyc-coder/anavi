import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3000", wait_until="commit", timeout=10000)

        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass

        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass

        # Interact with the page elements to simulate user flow
        # -> Navigate to http://localhost:3000
        await page.goto("http://localhost:3000", wait_until="commit", timeout=10000)
        # -> Navigate to /demo (http://localhost:3000/demo) to locate the demo banner and the 'Start Tour' control
        await page.goto("http://localhost:3000/demo", wait_until="commit", timeout=10000)
        # -> Locate and verify the 'Start Tour' button visibility
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        # -> Scroll down further to locate the 'Start Tour' button
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        # -> Search for 'Start Tour' button by scrolling up or checking other page areas
        await page.mouse.wheel(0, -await page.evaluate('() => window.innerHeight')) 
        # -> Scroll down to find the 'Start Tour' button and verify the demo banner and value callouts
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        

        # -> Scroll down or search further to locate the 'Start Tour' button
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        

        # -> Scroll up or down to locate the 'Start Tour' button and verify its visibility
        await page.mouse.wheel(0, -await page.evaluate('() => window.innerHeight'))
        

        # -> Scroll down or search further to locate the 'Start Tour' button and verify its visibility
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        

        # -> Search the page for the 'Start Tour' button by scrolling or looking for alternative triggers to start the tour
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        

        # -> Search for the 'Start Tour' button by scrolling or looking for alternative triggers to start the tour
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        

        # -> Search the page for any button or element labeled 'Start Tour' or similar to start the tour, or check for alternative tour start triggers
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        

        await page.mouse.wheel(0, -await page.evaluate('() => window.innerHeight'))
        

        # -> Check if clicking on any persona button triggers the tour start, as 'Start Tour' button is not visible
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/div[2]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the 'Start Demo' button to start the tour and verify the first guided step
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/div[2]/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Verify the presence of 'Next' button and 'Restart Tour' button as per the test instructions
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div[6]/div[2]/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=You are in Demo Mode — All data is simulated.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Restart Tour').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Start Tour').first).to_be_visible(timeout=30000)
        await frame.locator('text=Start Tour').first.click()
        await expect(frame.locator('text=Next').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Restart Tour').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    