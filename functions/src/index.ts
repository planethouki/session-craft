import { setGlobalOptions } from 'firebase-functions'
import * as admin from 'firebase-admin'

setGlobalOptions({
  maxInstances: 10,
  region: 'asia-northeast1',
})

admin.initializeApp()
