pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = credentials('docker-registry-url')   // e.g. "registry.example.com"
        DOCKER_IMAGE    = "${DOCKER_REGISTRY}/smartling-docker-mcp"
        DOCKER_CREDS    = credentials('docker-registry-creds')  // username/password credential
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            agent {
                docker {
                    image 'node:20-alpine'
                    reuseNode true
                }
            }
            steps {
                sh 'npm ci'
                sh 'npm run lint'
                sh 'npm test'
            }
        }

        stage('Build Image') {
            steps {
                script {
                    def tag = env.TAG_NAME ?: env.GIT_COMMIT?.take(8) ?: 'latest'
                    env.IMAGE_TAG = tag
                }
                sh "docker build -t ${DOCKER_IMAGE}:${IMAGE_TAG} -t ${DOCKER_IMAGE}:latest ."
            }
        }

        stage('Push Image') {
            when {
                anyOf {
                    branch 'main'
                    buildingTag()
                }
            }
            steps {
                sh """
                    echo "${DOCKER_CREDS_PSW}" | docker login ${DOCKER_REGISTRY} -u "${DOCKER_CREDS_USR}" --password-stdin
                    docker push ${DOCKER_IMAGE}:${IMAGE_TAG}
                    docker push ${DOCKER_IMAGE}:latest
                """
            }
        }
    }

    post {
        always {
            sh "docker logout ${DOCKER_REGISTRY} || true"
        }
    }
}
