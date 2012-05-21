package foundOps.mobile.mobileOps;

import android.os.Bundle;
import org.apache.cordova.*;

public class MobileOpsActivity extends DroidGap {
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.loadUrl("file:///android_asset/www/mobile.html");
    }
}