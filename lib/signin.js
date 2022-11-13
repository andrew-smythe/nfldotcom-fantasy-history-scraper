module.exports = {
    signin: async function(page) {
        let result = await page.evaluate(() => {
            let email = document.querySelector('input[type=email]');
            email.focus();
            email.select();
            document.execCommand('insertText', false, '[your_username]]');
            email.dispatchEvent(new Event('change', {bubbles: true}));

            let password = document.querySelector('input[type=password]');
            password.focus();
            password.select();
            document.execCommand('insertText', false, '[your_password]');
            password.dispatchEvent(new Event('change', {bubbles: true}));

            document.querySelectorAll('div[role=button]')[3].click(); 
        });   

        await page.waitForNavigation({
            waitUntil: 'networkidle0',
        });
    },
}