const fs = require('fs');
const path = require('path');

const dir = 'd:/apps/HedwigPost/public';

const pages = {
    'privacy.html': `
        <h1>Privacy Policy 🔒</h1>
        <p class="subtitle">Last updated: March 18, 2026</p>

        <p>At <strong>HedwigPost</strong> ("we," "us," or "our"), accessible from HedwigPost.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by HedwigPost and how we use it. If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.</p>

        <h2>1. General Data Collection</h2>
        <p>We collect information to provide better services to all our users. When you subscribe to our newsletter, leave a comment, or fill out a contact form, we collect personal information such as your name, email address, and IP address to prevent spam and abuse. We never sell your personal information to third parties.</p>

        <h2>2. Log Files</h2>
        <p>HedwigPost follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.</p>

        <h2>3. Google AdSense and DoubleClick DART Cookie</h2>
        <p>Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to www.website.com and other sites on the internet.</p>
        <ul>
            <li>Third party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites.</li>
            <li>Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our sites and/or other sites on the Internet.</li>
            <li>Users may opt out of personalized advertising by visiting <a href="https://myadcenter.google.com/" target="_blank" rel="nofollow">Ads Settings</a>. (Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info" target="_blank" rel="nofollow">www.aboutads.info</a>).</li>
        </ul>

        <h2>4. Our Advertising Partners</h2>
        <p>Some of advertisers on our site may use cookies and web beacons. Our advertising partners include Google AdSense and various Affiliate Marketing networks. Each of our advertising partners has their own Privacy Policy for their policies on user data. You may consult this list to find the Privacy Policy for each of the advertising partners of HedwigPost.</p>
        <p>Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on HedwigPost, which are sent directly to users' browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit. Note that HedwigPost has no access to or control over these cookies that are used by third-party advertisers.</p>

        <h2>5. CCPA Privacy Rights (Do Not Sell My Personal Information)</h2>
        <p>Under the CCPA, among other rights, California consumers have the right to:</p>
        <ul>
            <li>Request that a business that collects a consumer's personal data disclose the categories and specific pieces of personal data that a business has collected about consumers.</li>
            <li>Request that a business delete any personal data about the consumer that a business has collected.</li>
            <li>Request that a business that sells a consumer's personal data, not sell the consumer's personal data.</li>
        </ul>
        <p>If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.</p>

        <h2>6. GDPR Data Protection Rights</h2>
        <p>We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:</p>
        <ul>
            <li><strong>The right to access:</strong> You have the right to request copies of your personal data.</li>
            <li><strong>The right to rectification:</strong> You have the right to request that we correct any information you believe is inaccurate.</li>
            <li><strong>The right to erasure:</strong> You have the right to request that we erase your personal data, under certain conditions.</li>
        </ul>

        <h2>7. Children's Information</h2>
        <p>Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity. HedwigPost does not knowingly collect any Personal Identifiable Information from children under the age of 13.</p>

        <h2>8. Consent</h2>
        <p>By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.</p>
    `,
    'terms.html': `
        <h1>Terms of Service 📜</h1>
        <p class="subtitle">Last updated: March 18, 2026</p>

        <h2>1. Terms</h2>
        <p>By accessing the website at HedwigPost.com, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law.</p>

        <h2>2. Use License</h2>
        <p>Permission is granted to temporarily download one copy of the materials (information or software) on HedwigPost's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
        <ul>
            <li>modify or copy the materials;</li>
            <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
            <li>attempt to decompile or reverse engineer any software contained on HedwigPost's website;</li>
            <li>remove any copyright or other proprietary notations from the materials; or</li>
            <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
        </ul>

        <h2>3. Disclaimer</h2>
        <p>The materials on HedwigPost's website are provided on an 'as is' basis. HedwigPost makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
        <p>Further, HedwigPost does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.</p>

        <h2>4. Limitations</h2>
        <p>In no event shall HedwigPost or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on HedwigPost's website, even if HedwigPost or a HedwigPost authorized representative has been notified orally or in writing of the possibility of such damage.</p>

        <h2>5. Accuracy of materials</h2>
        <p>The materials appearing on HedwigPost's website could include technical, typographical, or photographic errors. HedwigPost does not warrant that any of the materials on its website are accurate, complete or current. HedwigPost may make changes to the materials contained on its website at any time without notice. However HedwigPost does not make any commitment to update the materials.</p>

        <h2>6. Links</h2>
        <p>HedwigPost has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by HedwigPost of the site. Use of any such linked website is at the user's own risk.</p>

        <h2>7. Site Terms of Service Modifications</h2>
        <p>HedwigPost may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>

        <h2>8. Governing Law</h2>
        <p>These terms and conditions are governed by and construed in accordance with the laws of your jurisdiction and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.</p>
    `,
    'disclaimer.html': `
        <h1>Disclaimer ⚖️</h1>
        <p class="subtitle">Last updated: March 18, 2026</p>

        <h2>1. FTC Affiliate Disclosure</h2>
        <p>HedwigPost believes in complete transparency. The Federal Trade Commission (FTC) requires that we disclose any relationship we have between a product manufacturer or service provider when we write about a product or service.</p>
        <p><strong>Here are the guidelines we operate under at HedwigPost:</strong></p>
        <ul>
            <li>We are never paid to do a positive review. We never accept money to review a product or service. We invest our own time to review and test products.</li>
            <li>If we create a link to a product or service, sometimes we may get paid a small commission if you purchase the product or service. This does not cost you anything extra (in fact, sometimes you'll get a discount through our links).</li>
            <li>We participates in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. As an Amazon Associate, we earn from qualifying purchases.</li>
            <li>No advertiser will ever influence the content, topics, or posts made in this blog.</li>
        </ul>
        <p>These commissions help support the ongoing operation, maintenance, and hosting of HedwigPost so we can continue bringing you high-quality tech news and reviews.</p>

        <h2>2. General Information Disclaimer</h2>
        <p>All the information on this website - HedwigPost.com - is published in good faith and for general information and educational purposes only. HedwigPost does not make any warranties about the completeness, reliability, and accuracy of this information. Any action you take upon the information you find on this website (HedwigPost), is strictly at your own risk. HedwigPost will not be liable for any losses and/or damages in connection with the use of our website.</p>

        <h2>3. Professional Advice Disclaimer</h2>
        <p>The information provided on HedwigPost does not constitute professional IT, cybersecurity, financial, or legal advice. While we strive to provide accurate technical tutorials and news, technology changes rapidly. You should not rely solely on our guides for critical enterprise infrastructure or sensitive security matters. Always consult with a certified professional or conduct your own thorough research before making technical decisions.</p>

        <h2>4. External Links</h2>
        <p>From our website, you can visit other websites by following hyperlinks to such external sites. While we strive to provide only quality links to useful and ethical websites, we have no control over the content and nature of these sites. These links to other websites do not imply a recommendation for all the content found on these sites. Site owners and content may change without notice and may occur before we have the opportunity to remove a link which may have gone 'bad'.</p>

        <h2>5. Consent</h2>
        <p>By using our website, you hereby consent to our disclaimer and agree to its terms.</p>
    `,
    'cookie-policy.html': `
        <h1>Cookie Policy 🍪</h1>
        <p class="subtitle">Last updated: March 18, 2026</p>

        <p>This Cookie policy explains what cookies are and how we use them. You should read this policy so you can understand what type of cookies we use, or the information we collect using cookies and how that information is used.</p>

        <h2>1. What Are Cookies?</h2>
        <p>Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you. Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your personal computer or mobile device when you go offline, while session cookies are deleted as soon as you close your web browser.</p>

        <h2>2. How HedwigPost Uses Cookies</h2>
        <p>When you use and access HedwigPost, we may place a number of cookies files in your web browser. We use cookies for the following purposes:</p>
        <ul>
            <li><strong>Essential Cookies:</strong> We use essential cookies to authenticate users and prevent fraudulent use of user accounts. They are also used to remember your theme preferences (Dark/Light mode).</li>
            <li><strong>Analytics Cookies:</strong> We use analytics cookies to track information how the Website is used so that we can make improvements. We may also use analytics cookies to test new pages, features, or new functionality of the Website to see how our users react to them.</li>
            <li><strong>Advertising & Targeting Cookies:</strong> These cookies are used to deliver advertisements more relevant to you and your interests. They are also used to limit the number of times you see an advertisement as well as help measure the effectiveness of the advertising campaigns. They are usually placed by advertising networks with the website operator’s permission (e.g., Google AdSense).</li>
            <li><strong>Affiliate Tracking Cookies:</strong> When you click on an affiliate link (e.g., in our Deals section or a product review), a cookie is placed to track that you originated from our site, ensuring we receive a commission for the referral. These cookies do not store personally identifiable data.</li>
        </ul>

        <h2>3. Third-Party Cookies</h2>
        <p>In addition to our own cookies, we may also use various third-parties cookies to report usage statistics of the Website, deliver advertisements on and through the Website, and so on. Specifically:</p>
        <ul>
            <li><strong>Google AdSense:</strong> Google uses cookies to serve ads based on your prior visits to our website or other websites. You may opt out of personalized advertising by visiting Google's <a href="https://myadcenter.google.com/" target="_blank" rel="nofollow">Ads Settings</a>.</li>
            <li><strong>Google Analytics:</strong> We use Google Analytics to analyze site traffic.</li>
        </ul>

        <h2>4. What Are Your Choices Regarding Cookies?</h2>
        <p>If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser.</p>
        <p>Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer, you may not be able to store your preferences, and some of our pages might not display properly.</p>
        <ul>
            <li>For the Chrome web browser, please visit this page from Google: <a href="https://support.google.com/accounts/answer/32050" target="_blank" rel="nofollow">Clear, enable, and manage cookies in Chrome</a></li>
            <li>For the Firefox web browser, please visit this page from Mozilla: <a href="https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored" target="_blank" rel="nofollow">Delete cookies to remove the information websites have stored on your computer</a></li>
            <li>For Safari, please visit Apple's support pages.</li>
        </ul>

        <h2>5. More Information</h2>
        <p>If you are looking for more information, you can contact us through our Contact page.</p>
    `,
    'advertise.html': `
        <h1>Advertise with Us 🚀</h1>
        <p class="subtitle">Reach a highly engaged audience of tech enthusiasts, developers, and early adopters.</p>

        <img src="/img/placeholder.jpg" alt="HedwigPost Audience" style="width:100%;height:300px;object-fit:cover;border-radius:12px;margin:20px 0;">

        <h2>1. Why Partner with HedwigPost?</h2>
        <p>HedwigPost is a rapidly growing digital publication dedicated to cutting-edge technology, artificial intelligence, software engineering, and consumer electronics. Our readers are decision-makers, tech professionals, and passionate consumers actively seeking the best tools, software, and gadgets.</p>
        
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin:30px 0;">
            <div style="background:var(--a-bg-2);padding:24px;border-radius:12px;text-align:center;border:1px solid var(--a-border);">
                <div style="font-size:2rem;font-weight:800;color:var(--a-accent);margin-bottom:8px;">500K+</div>
                <div style="font-size:.9rem;color:var(--a-text-2);">Monthly Pageviews</div>
            </div>
            <div style="background:var(--a-bg-2);padding:24px;border-radius:12px;text-align:center;border:1px solid var(--a-border);">
                <div style="font-size:2rem;font-weight:800;color:var(--a-green);margin-bottom:8px;">120K+</div>
                <div style="font-size:.9rem;color:var(--a-text-2);">Active Newsletter Subs</div>
            </div>
            <div style="background:var(--a-bg-2);padding:24px;border-radius:12px;text-align:center;border:1px solid var(--a-border);">
                <div style="font-size:2rem;font-weight:800;color:var(--a-purple);margin-bottom:8px;">85%</div>
                <div style="font-size:.9rem;color:var(--a-text-2);">US / UK / CA Audience</div>
            </div>
        </div>

        <h2>2. Advertising Opportunities</h2>
        <p>We offer diverse and highly viewable placements tailored to meet your campaign goals:</p>
        
        <h3>A. Display Advertising</h3>
        <p>High-impact banner placements strategically positioned for maximum viewability without disrupting the reading experience. Available via direct buy or programmatic guaranteed deals.</p>

        <h3>B. Sponsored Content & Product Reviews</h3>
        <p>Our editorial team can craft an in-depth, authentic review or tutorial featuring your software, API, or hardware. All sponsored content is clearly marked but maintains our signature deeply technical and objective tone, guaranteeing high engagement from our technical audience.</p>

        <h3>C. Newsletter Sponsorships</h3>
        <p>Place your brand directly in the inboxes of over 120,000 highly engaged subscribers in our weekly "Tech & Trends" roundup. Includes a prominent banner and a dedicated editorial native shout-out.</p>

        <h2>3. Audience Profile</h2>
        <ul>
            <li><strong>Professionals:</strong> 65% are Software Developers, Data Scientists, or IT Managers.</li>
            <li><strong>Purchasing Power:</strong> 72% report being the primary decision-maker for tech purchases in their households or companies.</li>
            <li><strong>Interests:</strong> SaaS Tools, Artificial Intelligence, Laptops, Mechanical Keyboards, Cloud Hosting, and Cybersecurity.</li>
        </ul>

        <h2>4. Get in Touch</h2>
        <p>Ready to amplify your brand? We'd love to chat. Please fill out the form below or email us directly at <strong>partnerships@hedwigpost.com</strong> to request our full media kit and rate card.</p>
        
        <div style="background:var(--a-bg-2);padding:30px;border-radius:12px;margin-top:20px;border:1px solid var(--a-border);">
            <form action="#" method="POST" onsubmit="event.preventDefault(); alert('Message sent successfully! Our partnership team will contact you shortly.');">
                <div style="margin-bottom:16px;">
                    <label style="display:block;margin-bottom:8px;font-weight:600;font-size:.9rem;">Company Name</label>
                    <input type="text" required style="width:100%;padding:12px;border-radius:8px;border:1px solid var(--a-border);background:var(--a-bg-1);color:var(--a-text-0);">
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;margin-bottom:8px;font-weight:600;font-size:.9rem;">Contact Email</label>
                    <input type="email" required style="width:100%;padding:12px;border-radius:8px;border:1px solid var(--a-border);background:var(--a-bg-1);color:var(--a-text-0);">
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;margin-bottom:8px;font-weight:600;font-size:.9rem;">Campaign Objectives / Inquiry</label>
                    <textarea required rows="4" style="width:100%;padding:12px;border-radius:8px;border:1px solid var(--a-border);background:var(--a-bg-1);color:var(--a-text-0);resize:vertical;"></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:14px;font-size:1rem;">Request Media Kit</button>
            </form>
        </div>
    `
};

Object.entries(pages).forEach(([filename, newContent]) => {
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) {
        let html = fs.readFileSync(filePath, 'utf8');
        
        let splitToken = html.includes('id="main-content">') ? 'id="main-content">' : 'class="static-page">';
        let parts = html.split(splitToken);
        if (parts.length > 1) {
            let before = parts[0] + splitToken;
            let parts2 = parts[1].split(/<\/(div|main)>\s*<footer class="footer">/);
            if (parts2.length > 2) {
                // Because of the capture group (div|main), the array looks like:
                // parts2[0] = content before
                // parts2[1] = captured 'div' or 'main'
                // parts2[2] = content after footer tag
                let closingTag = parts2[1];
                let after = '</' + closingTag + '>\\n    <footer class="footer">' + parts2[2];
                html = before + "\\n" + newContent + "\\n" + after;
                fs.writeFileSync(filePath, html);
                console.log('Successfully updated ' + filename);
            } else {
                console.log('Could not match footer in ' + filename);
            }
        } else {
            console.log('Could not match static-page div in ' + filename);
        }
    } else {
        console.log(filename + ' not found');
    }
});
