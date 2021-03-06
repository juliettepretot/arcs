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

package arcs.android.host

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.work.testing.WorkManagerTestInitHelper
import arcs.android.host.prod.ProdArcHostService
import arcs.android.sdk.host.toComponentName
import arcs.core.allocator.AllocatorTestBase
import arcs.core.host.TestingJvmProdHost
import arcs.core.data.Capabilities
import arcs.core.host.HostRegistry
import arcs.sdk.android.storage.service.testutil.TestConnectionFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.junit.Before
import org.junit.runner.RunWith
import org.robolectric.Robolectric

/**
 * These tests are the same as [AllocatorTestBase] but run with Android Services,
 * the real [ServiceStore], and a ramdisk.
 *
 */
@RunWith(AndroidJUnit4::class)
@OptIn(ExperimentalCoroutinesApi::class)
open class AndroidAllocatorTest : AllocatorTestBase() {

    protected lateinit var context: Context
    private lateinit var readingService: TestReadingExternalHostService
    private lateinit var testProdService: ProdArcHostService
    private lateinit var prodService: ProdArcHostService

    private lateinit var writingService: TestWritingExternalHostService

    override suspend fun hostRegistry(): HostRegistry {
        return AndroidManifestHostRegistry.createForTest(context) {
            GlobalScope.launch(Dispatchers.Unconfined) {
                val readingComponentName =
                    TestReadingExternalHostService::class.toComponentName(context)
                val testProdComponentName =
                    TestProdArcHostService::class.toComponentName(context)
                val prodComponentName =
                    ProdArcHostService::class.toComponentName(context)
                val writingComponentName =
                    TestWritingExternalHostService::class.toComponentName(context)
                when (it.component) {
                    readingComponentName -> readingService
                    testProdComponentName -> testProdService
                    prodComponentName -> prodService
                    writingComponentName -> writingService
                    else -> throw IllegalArgumentException("Unknown ${it.component}")
                }.onStartCommand(it, 0, 0)
            }
        }
    }

    override fun readingHost() = readingService.arcHost
    override fun writingHost() = writingService.arcHost
    override fun pureHost() = testProdService.arcHost as TestingJvmProdHost

    // TODO: wire up some kind of mock persistent database?
    override val storageCapability = Capabilities.TiedToRuntime

    @Before
    override fun setUp() = runBlocking {
        context = ApplicationProvider.getApplicationContext()
        context.setTheme(R.style.Theme_AppCompat);

        // Initialize WorkManager for instrumentation tests.
        WorkManagerTestInitHelper.initializeTestWorkManager(context)

        TestExternalArcHostService.testConnectionFactory = TestConnectionFactory(context)
        readingService = Robolectric.setupService(TestReadingExternalHostService::class.java)
        writingService = Robolectric.setupService(TestWritingExternalHostService::class.java)
        testProdService = Robolectric.setupService(TestProdArcHostService::class.java)
        prodService = Robolectric.setupService(ProdArcHostService::class.java)

        super.setUp()
    }

}
