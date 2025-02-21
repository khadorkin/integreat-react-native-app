/**
 * Upload a file to browserstack. The environment variable $BROWSERSTACK_LOGIN should contain the login with colons
 * @param path The path to the package
 */
void uploadToBrowserstack(String path) {
    return sh(
            script: '''
                    export UPLOAD_RESPONSE=$(curl -u $BROWSERSTACK_LOGIN -X POST "https://api-cloud.browserstack.com/app-automate/upload" -F "file=@''' + path + '''");
                    python -c "import json; print(json.loads('$UPLOAD_RESPONSE')['app_url'])"
                    ''',
            returnStdout: true
    )
}

void checkoutWithSubmodules() {
    checkout([
            $class: 'GitSCM',
            branches: scm.branches,
            doGenerateSubmoduleConfigurations: false,
            extensions: [[
                                 $class: 'SubmoduleOption',
                                 disableSubmodules: false,
                                 parentCredentials: true,
                                 recursiveSubmodules: true,
                                 reference: '',
                                 trackingSubmodules: false
                         ]],
            submoduleCfg: [],
            userRemoteConfigs: scm.userRemoteConfigs
    ])
}

pipeline {
    agent none
    options {
        timeout(time: 1, unit: 'HOURS')
        skipDefaultCheckout()
    }
    stages {
        stage('Run on mac and linux') {
            parallel {
                stage('mac') {
                    agent {
                        label "mac"
                    }
                    stages {
                        stage("Install dependencies") {
                            steps {
                                checkoutWithSubmodules()
                                sh 'yarn install --frozen-lockfile'
                            }
                        }
                        stage('Build Release for iOS') {
                            steps {
                                lock('pod-compilation') {
                                    // We are locking 2 steps here because:
                                    // 1)   "pod install" can not run parallel because pod does not support this
                                    // 2)   While the xcodebuild archive is running "pod install" must not be called by an
                                    //      an other build. Else the compilation fails to find e.g. included headers
                                    sh 'cd ios && pod install'
                                    xcodeBuild generateArchive: true, unlockKeychain: true, xcodeSchema: 'Integreat', configuration: 'Release', xcodeWorkspaceFile: 'ios/Integreat', keychainName: 'ios', xcodebuildArguments: 'NODE_BINARY=/usr/local/bin/node E2E_TEST_IDS=1 RCT_NO_LAUNCH_PACKAGER=true BUNDLE_CONFIG=./metro.config.ci.js ENABLE_BITCODE=NO'
                                }
                                sh 'xcodebuild -exportArchive -archivePath $WORKSPACE/build/Release-iphoneos/Integreat.xcarchive -exportOptionsPlist ios/ExportOptions/AdHocExportOptions.plist -exportPath output/export'
                                archiveArtifacts artifacts: 'output/export/**/*.*'
                            }
                        }
                        stage('Upload package for E2E') {
                            environment {
                                BROWSERSTACK_LOGIN = credentials("browserstack-login")
                            }
                            steps {
                                script {
                                    env.E2E_BROWSERSTACK_APP = uploadToBrowserstack("output/export/Integreat.ipa")
                                }
                            }
                        }
                        stage('E2E') {
                            environment {
                                BROWSERSTACK_LOGIN = credentials("browserstack-login")
                                E2E_BROWSERSTACK_USER = "$env.BROWSERSTACK_LOGIN_USR"
                                E2E_BROWSERSTACK_KEY = "$env.BROWSERSTACK_LOGIN_PSW"
                                E2E_BROWSERSTACK_APP = "$env.E2E_BROWSERSTACK_APP"
                                // Shared from "Upload package for E2E"
                                E2E_CAPS = 'ci_browserstack_ios'
                                E2E_PLATFORM = 'ios'
                                E2E_SERVER = 'browserstack'
                            }
                            steps {
                                sh 'yarn test:e2e'
                            }
                        }
                    }
                    post {
                        always {
                            cleanWs()
                        }
                    }
                }
                stage('linux') {
                    agent {
                        label "linux"
                    }
                    stages {
                        stage("Install dependencies") {
                            steps {
                                checkoutWithSubmodules()
                                sh 'yarn install --frozen-lockfile'
                            }
                        }
                        stage("Build Debug Bundle") {
                            environment {
                                BUNDLE_CONFIG = "./metro.config.ci.js"
                            }
                            steps {
                                sh 'yarn run bundle'
                            }
                        }
                        stage('Build Release for Android') {
                            environment {
                                ANDROID_HOME = '/opt/android-sdk/'
                                E2E_TEST_IDS = "1"
                                BUNDLE_CONFIG = "./metro.config.ci.js"
                            }
                            steps {
                                sh 'yarn run flow:check-now'
                                sh 'yarn run lint'
                                sh 'yarn run test'
                                sh 'cd android/ && ./gradlew build -x lint -x lintVitalRelease'
                                archiveArtifacts artifacts: 'android/app/build/outputs/apk/**/*.*'
                            }
                        }
                        stage('Upload package for E2E') {
                            environment {
                                BROWSERSTACK_LOGIN = credentials("browserstack-login")
                            }
                            steps {
                                script {
                                    env.E2E_BROWSERSTACK_APP = uploadToBrowserstack("android/app/build/outputs/apk/release/app-release.apk")
                                }
                            }
                        }
                        stage('E2E') {
                            environment {
                                BROWSERSTACK_LOGIN = credentials("browserstack-login")
                                E2E_BROWSERSTACK_USER = "$env.BROWSERSTACK_LOGIN_USR"
                                E2E_BROWSERSTACK_KEY = "$env.BROWSERSTACK_LOGIN_PSW"
                                E2E_BROWSERSTACK_APP = "$env.E2E_BROWSERSTACK_APP"
                                // Shared from "Upload package for E2E"
                                E2E_CAPS = 'ci_browserstack'
                                E2E_PLATFORM = 'android'
                                E2E_SERVER = 'browserstack'
                            }
                            steps {
                                sh 'yarn test:e2e'
                            }
                        }
                    }
                    post {
                        always {
                            cleanWs()
                        }
                    }
                }
            }
        }
    }
}

