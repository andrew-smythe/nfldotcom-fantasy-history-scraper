module.exports = {
    signin: async function(page, username, password) {
        await page.waitForSelector('input[inputmode=email]', { visible: true, timeout: 0 });
        
        let writeEmail = await page.evaluate((username) => {
            let email = document.querySelector('input[inputmode=email]');
            email.focus();
            email.select();
            document.execCommand('insertText', false, username);
            email.dispatchEvent(new Event('change', {bubbles: true}));
        }, username);

        await page.waitForSelector('button[value="Continue"]', { visible: true, timeout: 0 });
        await page.screenshot({ path: 'screenshots/email-login.png', fullPage: true });

        let clickContinueButton = await page.evaluate(() => {
            document.querySelector('button[value="Continue"]').click();
        });

        await page.waitForSelector('button[value="Sign in with password"]', { visible: true, timeout: 0 });
        await page.screenshot({ path: 'screenshots/continue-click.png', fullPage: true });

        let clickPasswordButton = await page.evaluate(() => {
            document.querySelector('button#onetrust-accept-btn-handler').click();
            document.querySelector('button[value="Sign in with password"]').click();
        });

        await page.waitForSelector('input[type=password]', { visible: true, timeout: 0 });
        await page.screenshot({ path: 'screenshots/password-click.png', fullPage: true });

        let writePasswordAndLogin = await page.evaluate((password) => {

            let passwordBox = document.querySelector('input[type=password]');
            passwordBox.focus();
            passwordBox.select();
            document.execCommand('insertText', false, password);
            passwordBox.dispatchEvent(new Event('change', {bubbles: true}));

            document.querySelector('button[value="Sign In"]').click();
        }, password);
        
        await page.screenshot({ path: 'screenshots/after-login.png', fullPage: true });
    },
}