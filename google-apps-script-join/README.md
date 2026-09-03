# Connect the orchestra application form

1. Open the application Google Sheet.
2. Choose **Extensions → Apps Script**.
3. Replace the contents of `Code.gs` with this folder's `Code.gs`.
4. Select `setupJoinApplications` and click **Run**. Approve Google Sheets and Drive access. This creates the Applications tab and a private Drive folder for clips.
5. Choose **Deploy → New deployment → Web app**.
6. Set **Execute as** to **Me** and **Who has access** to **Anyone**, then deploy.
7. Copy the web app URL ending in `/exec` and paste it between the quotation marks in `assets/js/join-config.js`.

The sheet stores contact information and a private Google Drive link for each performance clip. Do not make the upload folder public.
