import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaInterface;
import android.util.Log;
import android.provider.Settings;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class android_quit extends CordovaPlugin {

	public static final String TAG = "Cool Plugin";

	/**
	 * Constructor.
	 */
	public android_quit() {}

	/**
	 * Sets the context of the Command. This can then be used to do things like
	 * get file paths associated with the Activity.
	 *
	 * @param cordova The context of the main Activity.
	 * @param webView The CordovaWebView Cordova is running in.
	 */

	public void initialize(CordovaInterface cordova, CordovaWebView webView) {
		super.initialize(cordova, webView);
		Log.v(TAG,"Init android_quit");
	}

	public boolean execute(final String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

// Shows a toast
		Log.v(TAG,"android_quit received:"+ action);


		cordova.getActivity().runOnUiThread(new Runnable() {
			public void run() {
				android.os.Process.killProcess(android.os.Process.myPid());
				System.exit(0);
			}
		});

		return true;
	}
}