# Notion iOS starter for SideStore

This starter creates a small iOS app with a dark, Notion-inspired workspace. The interface is bundled in `Resources/index.html` and displayed by a SwiftUI `WKWebView`. Notes, tasks, projects and ideas are saved locally inside the app.

## IGNORE 

Build an unsigned IPA with GitHub Actions

1. Upload the contents of this folder into the root of `non937393/Notion` (keep the `.github/workflows/build-ipa.yml` path).
2. Open the repository's **Actions** tab.
3. Choose **Build Notion IPA** and tap **Run workflow**.
4. When the run succeeds, open the run and download the `Notion-unsigned-IPA` artifact. GitHub downloads artifacts as a ZIP; extract it to get `Notion.ipa`.
5. Import the IPA into SideStore and try installing it. SideStore signs apps using your Apple Account. An unsigned IPA is a common distribution format for this workflow, but installation can still fail if the app/package is incompatible.

Notes

- Bundle ID: `com.non937393.notion`.
- This is not the official Notion app and has no account or cloud sync.
- The starter is configured for iOS 16 and later.
- Do not add Apple ID passwords or signing secrets to the repository.
- GitHub's website does not unpack ZIPs into folders. If you are only using an iPhone, you may need to create/upload each file and preserve the paths, or use a trusted Git client that supports repository uploads.
