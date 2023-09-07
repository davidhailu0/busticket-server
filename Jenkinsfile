pipeline{
    agent any
    environment {
        TAG = sh(returnStdout: true, script: "git describe --tags --abbrev=0").trim()
    }
    stages{
        stage("Build Server"){
            steps{
                sh "docker build -t server:${TAG} -f dockerfile.production ."
                sh "docker build -t testserver:${TAG} -f dockerfile.test ."
            }
        }
        stage("Test"){
            steps{
                sh "docker run -d --network docker_network --name production_server_test testserver:${TAG} yarn start"
                sh "docker run --network docker_network --name production_server_test_runner -e HOST=production_server_test testserver:${TAG}"
            }
        }
        stage("Push To Registry"){
            steps{
                sh "docker tag server:${TAG} 38.242.195.64:7000/server:${TAG}"
                sh "docker tag server:${TAG} 38.242.195.64:7000/server:latest"
                sh "docker push 38.242.195.64:7000/server:${TAG}"
                sh "docker push 38.242.195.64:7000/server:latest"
            }
        }
    }
    post{
        always{
            sh "docker rmi -f server:${TAG} testserver:${TAG}"
            sh "docker rm -f production_server_test production_server_test_runner"
        }
    }
}
