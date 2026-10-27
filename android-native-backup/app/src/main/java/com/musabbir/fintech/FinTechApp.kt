package com.musabbir.fintech

import android.app.Application
import com.musabbir.fintech.data.local.FinTechDatabase
import com.musabbir.fintech.data.repository.FinTechRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob

class FinTechApp : Application() {
    private val applicationScope = CoroutineScope(SupervisorJob())

    val database by lazy { FinTechDatabase.getDatabase(this, applicationScope) }
    val repository by lazy { FinTechRepository(database.dao()) }
}
