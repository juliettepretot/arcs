package arcs.sdk.android.storage.service.e2e

import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.IBinder
import arcs.core.storage.StorageKey
import arcs.core.storage.driver.RamDiskDriverProvider
import arcs.sdk.android.storage.ResurrectionHelper

/** Client of the [StorageService]. */
class ClientService : Service() {
    /** History of resurrection notifications. */
    val resurrectionReceipts = mutableListOf<List<StorageKey>>()

    private val resurrectionHelper: ResurrectionHelper by lazy {
        ResurrectionHelper(this, ::onResurrected)
    }

    init {
        RamDiskDriverProvider()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        resurrectionHelper.onStartCommand(intent)
        return super.onStartCommand(intent, flags, startId)
    }

    override fun onBind(intent: Intent?): IBinder? = ServiceBinder()

    /** Registers for resurrection with the [StorageService]. */
    fun registerForResurrection(keys: List<StorageKey>) =
        resurrectionHelper.requestResurrection(keys)

    /** Unregisters for resurrection. */
    fun unregisterForResurrection() = resurrectionHelper.cancelResurrectionRequest()

    private fun onResurrected(keys: List<StorageKey>) {
        resurrectionReceipts.add(keys)
    }

    inner class ServiceBinder : Binder() {
        val service: ClientService
            get() = this@ClientService
    }
}