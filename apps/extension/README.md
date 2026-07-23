# Chrome extension

The extension starts a timer for the current HTTP(S) tab. It reads no page
content and requests only Chrome's `activeTab` permission.

Before Google Workspace organization distribution:

1. Create a zip containing the files in this directory.
2. Upload it through the Chrome Web Store / Google Workspace organization
   workflow and note the assigned extension ID.
3. Set Helm `runtime.chromeExtensionOrigin` to
   `chrome-extension://<extension-id>` and deploy the API.

No signing certificate or extension private key belongs in this repository.
