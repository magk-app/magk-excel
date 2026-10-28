"""Record the scripted analyst demo (/?demo=analyst) to a 1080p mp4.

Needs Xvfb, ffmpeg and Chrome. Start the demo server first:
  npx vite --config scripts/demo/vite.demo.config.ts
Then: python3 scripts/demo/record-analyst-demo.py [out.mp4]
"""
import asyncio, os, subprocess, sys, tempfile
from playwright.async_api import async_playwright

OUT = sys.argv[1] if len(sys.argv) > 1 else 'magk-excel-analyst-demo.mp4'
URL = os.environ.get('DEMO_URL', 'http://127.0.0.1:5174/?demo=analyst&record=1')
CHROME = os.environ.get('CHROME_PATH', '/home/ubuntu/.local/bin/google-chrome')
DISPLAY = ':99'

async def main():
    xvfb = subprocess.Popen(['Xvfb', DISPLAY, '-screen', '0', '1920x1080x24', '-nolisten', 'tcp'])
    await asyncio.sleep(1)
    os.environ['DISPLAY'] = DISPLAY
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch_persistent_context(
                tempfile.mkdtemp(prefix='magk-demo-'), executable_path=CHROME, headless=False, no_viewport=True,
                args=['--no-sandbox', f'--app={URL}', '--window-position=0,0',
                      '--window-size=1920,1080', '--hide-scrollbars', '--disable-infobars',
                      '--force-device-scale-factor=1', '--no-first-run'],
                ignore_default_args=['--enable-automation'],
            )
            page = browser.pages[0] if browser.pages else await browser.new_page()
            page.on('pageerror', lambda e: print('PAGEERR', e))
            if 'demo=analyst' not in page.url:
                await page.goto(URL)
            await page.wait_for_selector('text=AI workflows for financial analysts')
            await asyncio.sleep(2)
            if os.environ.get('CHECK_ONLY'):
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'x11grab', '-video_size', '1920x1080',
                                '-i', f'{DISPLAY}.0', '-frames:v', '1', OUT])
                await browser.close()
                return
            ffmpeg = subprocess.Popen(
                ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'x11grab', '-draw_mouse', '0', '-framerate', '30',
                 '-video_size', '1920x1080', '-i', f'{DISPLAY}.0', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
                 '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT],
                stdin=subprocess.PIPE)
            await asyncio.sleep(0.5)
            await page.evaluate('window.__magkDemoStart = true')
            await page.wait_for_function('window.__magkDemoDone === true', timeout=600_000, polling=200)
            ffmpeg.communicate(b'q')
            await browser.close()
    finally:
        xvfb.terminate()
    print('wrote', OUT)

asyncio.run(main())
