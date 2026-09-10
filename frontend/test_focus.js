import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    
    await page.goto('http://localhost:3000/login');
    await page.type('input[type="email"]', 'mahesh0562.be23@chitkara.edu.in');
    await page.type('input[type="password"]', '123456789');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    await page.goto('http://localhost:3000/profile');
    await page.waitForSelector('button.btn-secondary');
    
    // Click "Edit Profile"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(b => b.textContent.includes('Edit Profile'));
      if(editBtn) editBtn.click();
    });
    
    await page.waitForSelector('#prof-university');
    
    // Clear logs
    await page.evaluate(() => console.clear());
    
    // Type one character in field of study
    await page.focus('#prof-field');
    await page.keyboard.type('A');
    
    await new Promise(r => setTimeout(r, 500));
    
    const activeElementId = await page.evaluate(() => document.activeElement.id);
    console.log("Active element after typing 'A' in field of study:", activeElementId);

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
