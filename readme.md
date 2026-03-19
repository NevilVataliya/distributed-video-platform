# HexaNodes Distributed Video Platform - Infrastructure

## How to start the servers
1. Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
2. Open your terminal in this folder.
3. Run this command:
   `docker-compose up -d`

## Important URLs & Passwords
Once it is running, you can access the tools here:

* **MinIO Storage Dashboard:** [http://localhost:9001](http://localhost:9001)
  * *Username:* admin
  * *Password:* password123
  * *(Go here and click "Create Bucket" to make a `raw-videos` and `processed-videos` bucket!)*

* **RabbitMQ Dashboard:** [http://localhost:15672](http://localhost:15672)
  * *Username:* guest
  * *Password:* guest

* **MongoDB Connection String:** `mongodb://localhost:27017`

* **Nginx RTMP Stream URL (For OBS):** `rtmp://localhost/live`