package com.musabbir.fintech

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.musabbir.fintech.ui.navigation.FinTechNavGraph
import com.musabbir.fintech.ui.theme.FinTechTheme
import com.musabbir.fintech.ui.viewmodel.FinTechViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: FinTechViewModel by viewModels {
        object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val app = application as FinTechApp
                @Suppress("UNCHECKED_CAST")
                return FinTechViewModel(app.repository) as T
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            FinTechTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    FinTechNavGraph(viewModel = viewModel)
                }
            }
        }
    }
}
