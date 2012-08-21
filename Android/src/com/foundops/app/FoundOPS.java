package com.foundops.app;

import org.apache.cordova.DroidGap;

import android.os.Bundle;
import android.view.Menu;

public class FoundOPS extends DroidGap {
	
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.loadUrl("file:///android_asset/www/navigator.html");
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.activity_found_ops, menu);
        return true;
    }
    
}
