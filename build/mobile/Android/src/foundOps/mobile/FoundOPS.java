package foundOps.mobile;

import org.apache.cordova.*;

import android.os.Bundle;
import android.view.Menu;

public class FoundOPS extends DroidGap {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		super.loadUrl("file:///android_asset/www/index.html");
	}

//	@Override
//	public boolean onCreateOptionsMenu(Menu menu) {
//		getMenuInflater().inflate(R.menu.activity_found_ops, menu);
//		return false;
//	}
}