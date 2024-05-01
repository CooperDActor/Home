// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB_nMz_YUjuBD0hdOGxbNSN6gN1B47A9_4",
    authDomain: "cooperisacaller.firebaseapp.com",
    projectId: "cooperisacaller",
    storageBucket: "cooperisacaller.appspot.com",
    messagingSenderId: "218449124123",
    appId: "1:218449124123:web:8f2dd7adc58611793fd1be",
    databaseURL: "https://cooperisacaller-default-rtdb.firebaseio.com",
};

firebase.initializeApp(firebaseConfig);

const database = firebase.database();

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const callCodeInput = document.getElementById('callCodeInput');
const joinButton = document.getElementById('joinButton');

let localStream;
let peerConnection;
let callCode;

joinButton.addEventListener('click', async () => {
    callCode = callCodeInput.value.trim();
    if (callCode === '') {
        alert('Please enter a valid call code.');
        return;
    }

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
        peerConnection = new RTCPeerConnection(configuration);

        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.addEventListener('track', event => {
            remoteVideo.srcObject = event.streams[0];
        });

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // Save offer to Firebase
        database.ref(`calls/${callCode}/offer`).set({
            sdp: offer.sdp,
            type: offer.type
        });

        // Listen for answer from Firebase
        database.ref(`calls/${callCode}/answer`).on('value', async (snapshot) => {
            const answer = snapshot.val();
            if (answer) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        // Listen for ICE candidates from Firebase
        peerConnection.addEventListener('icecandidate', (event) => {
            if (event.candidate) {
                database.ref(`calls/${callCode}/iceCandidates`).push(event.candidate.toJSON());
            }
        });

    } catch (error) {
        console.error('Error joining call:', error);
    }
});

// Listen for ICE candidates from Firebase and add them to the peer connection
database.ref(`calls/${callCode}/iceCandidates`).on('child_added', (snapshot) => {
    const candidate = new RTCIceCandidate(snapshot.val());
    peerConnection.addIceCandidate(candidate);
});
