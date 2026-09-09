<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8168c51d-4366-44d3-978c-f3aaf38dc25f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Windows download warning

If Chrome or Google Drive blocks the Windows installer as a dangerous file, this is usually because the `.exe` is unsigned or has little download reputation. The current build is not signed by default.

To publish a trusted Windows installer:

1. Purchase an Authenticode code-signing certificate from a trusted certificate authority. OV or EV certificates are preferable for a public medical application.
2. Export the certificate as a `.p12` or `.pfx` file and keep it outside the repository.
3. Before building, set these environment variables in PowerShell:

   ```powershell
   $env:CSC_LINK = "C:\path\to\medicab-signing.p12"
   $env:CSC_KEY_PASSWORD = "your-certificate-password"
   npm run electron:build:win
   ```

4. Upload the signed installer from `release/` to a stable HTTPS release page, preferably GitHub Releases, and avoid renaming it repeatedly.
5. Submit the exact download URL to Google Safe Browsing if it is still blocked: https://www.google.com/safebrowsing/report_phish/

Do not commit the certificate or its password. Signing reduces SmartScreen and Chrome warnings, but a new download may still need time to build reputation. Never advise users to disable browser or antivirus protection.
