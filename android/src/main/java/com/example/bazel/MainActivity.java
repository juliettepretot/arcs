package com.example.bazel;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.logging.Logger;

/**
 * Main class for the Bazel Android "Hello, World" app.
 */
public class MainActivity extends Activity {

  private static final Logger logger = Logger.getLogger(MainActivity.class.getName());
  private static final String CHANNEL_ID = "arcs_channel_id";

  private WebView shellWebView;
  private WebView renderingWebView;
  private NotificationManager notificationManager;
  private int notificationId = 0;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    notificationManager =
            (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

    NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Arcs notifications",
            NotificationManager.IMPORTANCE_DEFAULT);
    notificationManager.createNotificationChannel(channel);

    TextView refreshButton = new TextView(this);
    refreshButton.setText("Refresh");
    refreshButton.setOnClickListener(v -> shellWebView.reload());

    shellWebView = new WebView(this);
    shellWebView.setVisibility(View.GONE);
    setWebviewSettings(shellWebView.getSettings());
    shellWebView.addJavascriptInterface(this, "Android");
    shellWebView.loadUrl("file:///android_asset/pipes_shell_dist/index.html?log");

    renderingWebView = new WebView(this);
    setWebviewSettings(renderingWebView.getSettings());
    renderingWebView.addJavascriptInterface(this, "Android");
    renderingWebView.loadUrl("file:///android_asset/pipes_surface_dist/surface.html");

    WebView.setWebContentsDebuggingEnabled(true);

    LinearLayout layout = new LinearLayout(this);
    layout.setOrientation(LinearLayout.VERTICAL);
    layout.addView(refreshButton);
    layout.addView(shellWebView);
    layout.addView(renderingWebView);
    setContentView(layout);
  }

  @SuppressLint("SetJavaScriptEnabled")
  private void setWebviewSettings(WebSettings settings) {
    settings.setDatabaseEnabled(true);
    settings.setGeolocationEnabled(true);
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setSafeBrowsingEnabled(false);
    settings.setAllowFileAccessFromFileURLs(true);
    settings.setAllowUniversalAccessFromFileURLs(true);
  }

  @JavascriptInterface
  public void sendToShell(String message) {
    logger.info("Sending to JS: " + message);
    shellWebView.post(() -> shellWebView.evaluateJavascript(String.format("window.ShellApi.receive(%s);", message), null));
  }

  private void render(JSONObject obj, int tid) {
    logger.info("Sending something to renderer.");
    renderingWebView.post(() -> {
      renderingWebView.evaluateJavascript(String.format("window.renderer.dispatch = (pid, eventlet) => Android.sendToShell(JSON.stringify({message: 'event', tid: %s, pid, eventlet}));", tid), null);
      renderingWebView.evaluateJavascript(String.format("window.renderer.render(%s);", obj.toString()), null);
    });
  }

  @JavascriptInterface
  public void receive(String json) throws JSONException {
    JSONObject obj = new JSONObject(json);
    String message = obj.getString("message");
    logger.info("Java received message: " + message);
    switch (message) {
      case "ready":
//        sendToShell("{\"message\": \"spawn\", \"recipe\": \"Notification\"}");
//        sendToShell("{\"message\": \"spawn\", \"recipe\": \"Restaurants\"}");
        sendToShell("{\"message\": \"spawn\", \"recipe\": \"CatOfTheDay\"}");
        break;
      case "slot":
        if (obj.isNull("content")) {
          break;
        }
        JSONObject content = obj.getJSONObject("content");
        if (content.isNull("model")) {
          break;
        }
        JSONObject model = content.getJSONObject("model");
        if (model.isNull("modality")) {
          int tid = obj.getInt("tid");
          render(content, tid);
        } else {
          String modality = model.getString("modality");
          processModality(modality, model);
        }
        break;
      default:
        logger.info("Got unhandled message of type: " + message);
        break;
    }
  }

  /** Handles different slot modalities. */
  private void processModality(String modality, JSONObject model) throws JSONException {
    switch (modality) {
      case "notification":
        String text = model.getString("text");
        showNotification(text);
        break;
      default:
        throw new AssertionError("Unhandled modality: " + modality);
    }
  }

  private void showNotification(String title) {
    Notification notification = new Notification.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
//            .setContentText(subject)
            .setSmallIcon(R.drawable.baseline_sms_black_24)
//            .setLargeIcon(aBitmap)
            .build();
    notificationManager.notify(notificationId++, notification);
  }

  /** Show a toast from the web page */
  @JavascriptInterface
  public void showToast(String toast) {
    Toast.makeText(this, toast, Toast.LENGTH_SHORT).show();
  }

  /** Called when the WebView is ready. */
  @JavascriptInterface
  public void onLoad() {
    logger.info("onLoad called");
    shellWebView.post(() -> {
      shellWebView.evaluateJavascript("window.DeviceClient = { receive(json) { Android.receive(json); } };", null);
      shellWebView.evaluateJavascript("window.startTheShell();", null);
    });
  }
}
