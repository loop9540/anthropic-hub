# Anthropic Hub

A static site with two pages:

- `index.html`: the Anthropic tracker (news, models, products, Claude Code PRs).
- `mindmap.html`: an interactive, drag and drop mind map of people and the connections between them.

## Mind map

Open `mindmap.html`. Everything is saved in your browser automatically.

- Add people with the **Add person** button, the `N` key, or by double clicking the canvas.
- Drag cards to move them. Drag the background to pan, scroll or pinch to zoom, press `F` to fit.
- Pull the **+** handle on a card onto another card to connect them. Drop it on empty space to create a new, already connected person.
- Click a line and press the red ✕ (or `Delete`) to remove a connection. Select a card and press `Delete` to remove a person.
- **Auto layout** (`L`) arranges everyone around the most connected person. **Undo** is `Ctrl+Z`.
- **Export** and **Import** move the map between browsers as JSON.

### Importing people from Gmail

The **Gmail** button scans your recent mail and adds the people you exchange email with, connected to you and to each other. The page talks to Gmail directly from your browser using only the From, To and Cc headers. Message contents are never requested and nothing leaves your browser except the requests to Google.

Google requires a free OAuth Client ID for this. One time setup:

1. In [Google Cloud Console](https://console.cloud.google.com/apis/library/gmail.googleapis.com), create a project if needed and **Enable** the Gmail API.
2. Under [Google Auth platform](https://console.cloud.google.com/auth/overview), configure the consent screen as **External** and add your own Gmail address as a **Test user**.
3. Under [Credentials](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** of type **Web application** and add the URL you host the site at (for example `https://<user>.github.io`) as an **Authorized JavaScript origin**.
4. Open the mind map, click **Gmail**, and paste the Client ID. It is remembered in your browser. You can also hardcode it in the `GOOGLE_CLIENT_ID` constant near the top of the script in `mindmap.html`.

The import skips automated senders (no-reply addresses, notifications, newsletters, and the like) and never adds someone who is already on the map.
