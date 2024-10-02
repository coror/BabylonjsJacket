<template>
  <main>
    <header>
      <h1>HI - VIS WORKWEAR</h1>
    </header>
    <section>
      <canvas></canvas>
      <div class="mode-buttons">
        <button @click="changeMode('DAY')">Day Mode</button>
        <button @click="changeMode('REFLECTIVE')">Reflective Mode</button>
        <button @click="changeMode('NIGHT')">Night Mode</button>
      </div>
    </section>
    <div v-if="showOverlay" class="overlay">
      <div class="popup">
        <h2>Jacket Information</h2>
        <p>{{ selectedInfo }}</p>
        <img src="../../public/images/label1.jpg"/>
        <button class="buttonClose" @click="closeOverlay">Close</button>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { Jacket } from '@/BabylonClasses/Jacket';
import { ref, onMounted, onBeforeUnmount } from 'vue';

export default {
  name: 'ProductPreview',
  setup() {
    const showOverlay = ref(false);
    const selectedInfo = ref('');
    const canvas = ref<HTMLCanvasElement | null>(null);
    const jacketInstance = ref<Jacket | null>(null);

    const onBallClick = (info: string) => {
      selectedInfo.value = info;
      showOverlay.value = true;
    };

    const closeOverlay = () => {
      showOverlay.value = false;
    };

    const changeMode = (mode: 'DAY' | 'REFLECTIVE' | 'NIGHT') => {
      if (jacketInstance.value) {
        // Dispose of the existing instance (if needed)
        jacketInstance.value = null;
      }
      // Recreate the jacket with the new mode
      createJacket(mode);
    };

    const createJacket = (mode: 'DAY' | 'REFLECTIVE' | 'NIGHT') => {
      if (canvas.value) {
        jacketInstance.value = new Jacket(canvas.value, onBallClick, mode);
      }
    };

    onMounted(() => {
      canvas.value = document.querySelector('canvas') as HTMLCanvasElement;
      createJacket('DAY'); // Initialize with DAY mode
    });

    // Cleanup on unmount
    onBeforeUnmount(() => {
      if (jacketInstance.value) {
        jacketInstance.value = null;
      }
    });

    return {
      showOverlay,
      selectedInfo,
      onBallClick,
      closeOverlay,
      changeMode,
      canvas,
    };
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=PT+Serif:ital@1&family=Raleway:wght@300&family=Roboto+Condensed&display=swap');
main {
  background: white;
  width: 100%;
  height: 100%;
  background-image: repeating-linear-gradient(
    45deg,
    rgb(255, 255, 255),
    rgb(255, 255, 255) 30px,
    #f7f6f6 30px,
    #f7f6f6 80px
  );

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}

header {
  width: 100%;
  height: 4rem;
  background: white;
  font-family: 'Roboto Condensed';
  font-weight: 400;
  color: rgb(37, 37, 37);
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-left: 1rem;
  border-bottom: 1px solid rgb(175, 175, 175);
}

h1 {
  font-size: 2rem;
  letter-spacing: 10px;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); /* Darken background */
  display: flex;
  justify-content: center;
  align-items: center;
}

.popup {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
  display: flex; /* Use flexbox */
  flex-direction: column; /* Arrange children vertically */
  justify-content: space-between; /* Space out the content */
  width: 100%;
}


.buttonClose {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: black;
  color: white;
  border: none;
  cursor: pointer;
  width: 10rem;
  margin: 1rem auto;
}

h3,
h4 {
  font-family: 'PT Serif';
  width: 100;
}

#price {
  font-family: 'Raleway';
  font-size: 1rem;
}

section {
  width: 80%;
  height: 80%;
  background: white;
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0.25rem;
  border-radius: 4px;
  box-shadow: 1px 8px 5px -7px rgba(0, 0, 0, 0.5);
  -webkit-box-shadow: 1px 8px 5px -7px rgba(0, 0, 0, 0.5);
  -moz-box-shadow: 1px 8px 5px -7px rgba(0, 0, 0, 0.5);
}

canvas {
  width: 100%;
  height: 90%;
  background: none;
  border-radius: 4px;
  border: none;
  outline: none;
}

#productDetails {
  width: 30%;
  height: 100%;
  background: white;
  font-family: 'Raleway';
  padding: 1rem;
}

#description {
  width: 100%;
  height: 70%;
  background: none;
  margin-top: 2rem;
}

.mode-buttons {
  margin-top: 1rem; /* Space between canvas and buttons */
  margin-bottom: 1rem;
  display: flex; /* Flex layout for buttons */
  justify-content: center; /* Center the buttons horizontally */
  align-items: center;
  gap: 10px; /* Space between buttons */
}

button {
  padding: 0.5rem 1rem; /* Button padding */
  background-color: black; /* Button background color */
  color: white; /* Button text color */
  border: none; /* Remove border */
  cursor: pointer; /* Pointer cursor on hover */
  border-radius: 5px; /* Rounded corners for buttons */
  transition: background-color 0.3s; /* Transition for hover effect */
}

button:hover {
  background-color: #333; /* Darker background on hover */
}

</style>
