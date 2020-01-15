/*
 * Copyright 2020 Google LLC.
 *
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 *
 * Code distributed by Google as part of this project is also subject to an additional IP rights
 * grant found at
 * http://polymer.github.io/PATENTS.txt
 */

package arcs.sdk.android.storage.service.e2e

import android.app.Application
import android.content.Intent
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleObserver
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.rule.ServiceTestRule
import arcs.android.crdt.ParcelableCrdtType
import arcs.android.storage.service.IStorageService
import arcs.android.storage.toParcelable
import arcs.core.crdt.CrdtCount
import arcs.core.data.CountType
import arcs.core.storage.ExistenceCriteria
import arcs.core.storage.ProxyMessage
import arcs.core.storage.StoreOptions
import arcs.core.storage.driver.RamDiskStorageKey
import arcs.sdk.android.storage.ServiceStore
import arcs.sdk.android.storage.service.DefaultConnectionFactory
import arcs.sdk.android.storage.service.StorageService
import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@Suppress("EXPERIMENTAL_API_USAGE")
@RunWith(AndroidJUnit4::class)
class StorageServiceTest {
    private lateinit var app: Application
    private lateinit var storeOptions: StoreOptions<CrdtCount.Data, CrdtCount.Operation, Int>
    private lateinit var lifecycle: DummyLifecycle
    @get:Rule
    val serviceTestRule = ServiceTestRule()

    @Before
    fun setUp() {
        app = ApplicationProvider.getApplicationContext()
        lifecycle = DummyLifecycle()
        storeOptions = StoreOptions(
            RamDiskStorageKey("count"),
            ExistenceCriteria.MayExist,
            CountType()
        )
    }

    private suspend fun makeServiceStore() = ServiceStore(
        storeOptions,
        ParcelableCrdtType.Count,
        lifecycle,
        DefaultConnectionFactory(app, coroutineContext = coroutineContext),
        coroutineContext
    )

    @Test
    fun sendingProxyMessage_resultsInResurrectionIntentSend() = runBlocking {
        val clientService = bindClientService()
        val serviceStore = makeServiceStore()

        // Setup:
        // Add a resurrection request to the storage service.
        clientService.registerForResurrection(listOf(storeOptions.storageKey))

        delay(1000)

        // Act:
        // Issue a proxy message to the binding context (and transitively: to the storage service)
        val op = CrdtCount.Operation.Increment("foo", 0 to 1)
        serviceStore.initialize()
        val success = serviceStore.onProxyMessage(
            ProxyMessage.Operations(listOf(op), id = 1)
        )
        assertThat(success).isTrue()

        delay(1000)

        // Verify:
        assertThat(clientService.resurrectionReceipts).hasSize(1)
        assertThat(clientService.resurrectionReceipts[0]).containsExactly(storeOptions.storageKey)
        Unit
    }

    private fun bindStorageService(storeOptions: StoreOptions<*, *, *>): IStorageService {
        val intent = StorageService.createBindIntent(
            app,
            storeOptions.toParcelable(ParcelableCrdtType.Count)
        )
        return IStorageService.Stub.asInterface(serviceTestRule.bindService(intent))
    }

    private fun bindClientService(): ClientService {
        val intent = Intent(app, ClientService::class.java)
        return (serviceTestRule.bindService(intent) as ClientService.ServiceBinder).service
    }

    private class DummyLifecycle : Lifecycle() {
        private val observers = mutableSetOf<LifecycleObserver>()
        override fun addObserver(observer: LifecycleObserver) {
            observers.add(observer)
        }

        override fun removeObserver(observer: LifecycleObserver) {
            observers.remove(observer)
        }

        override fun getCurrentState(): State = State.CREATED
    }
}

