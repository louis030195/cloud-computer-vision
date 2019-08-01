FROM gitpod/workspace-full

RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list \
 && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - \
 && sudo apt-get update \
 && sudo apt-get install -y google-cloud-sdk \
 && sudo apt-get install -y ffmpeg \
 && sudo rm -rf /var/lib/apt/lists/*