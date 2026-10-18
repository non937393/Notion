import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        WorkspaceWebView()
            .ignoresSafeArea(.container, edges: .bottom)
            .background(Color(red: 0.055, green: 0.06, blue: 0.075))
    }
}

struct WorkspaceWebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView(frame: .zero, configuration: WKWebViewConfiguration())
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.055, green: 0.06, blue: 0.075, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        if let url = Bundle.main.url(forResource: "index", withExtension: "html") {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            webView.loadHTMLString("<body style='background:#0e1014;color:white;font:17px -apple-system;padding:24px'><h1>Notion</h1><p>Missing bundled index.html.</p></body>", baseURL: nil)
        }
        return webView
    }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
