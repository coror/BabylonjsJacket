import {
  AbstractMesh,
  ActionManager,
  Animation,
  ArcRotateCamera,
  Color3,
  Color4,
  CubeTexture,
  Engine,
  ExecuteCodeAction,
  HemisphericLight,
  MeshBuilder,
  PBRMaterial,
  Scene,
  SceneLoader,
  SpotLight,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import '@babylonjs/loaders';

export class Jacket {
  scene: Scene;
  engine: Engine;
  jacket?: AbstractMesh;
  camera!: ArcRotateCamera;
  hemisphericLight?: HemisphericLight;
  spotlight?: SpotLight;
  ball?: AbstractMesh;
  outerBalls: AbstractMesh[] = [];
  ballDetails: { positon: Vector3; info: string }[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    public onBallClick?: (info: string) => void,
    public mode: 'DAY' | 'REFLECTIVE' | 'NIGHT' = 'DAY' // Default to DAY
  ) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.engine.displayLoadingUI();

    this.CreateCamera();
    this.CreateJacket().then(() => {
      this.CreateMultipleSpheres();
      this.engine.hideLoadingUI();
    });

    // Resize the engine on window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // Set the background color based on the mode
    if (this.mode === 'DAY') {
      scene.clearColor = new Color4(1, 1, 1, 1); // White background for DAY mode
    } else {
      scene.clearColor = new Color4(0, 0, 0, 1); // Black background for NIGHT or REFLECTIVE
    }

    // // Add hemispheric light
    // this.light = new HemisphericLight(
    //   'hemisphericLight',
    //   new Vector3(0, 1, 0),
    //   scene
    // );
    // this.light.intensity = 0.7; // Adjust intensity as needed

    // const envTex = CubeTexture.CreateFromPrefilteredData(
    //   './environment/xmas_bg.env',
    //   scene
    // );

    // envTex.gammaSpace = false;
    // envTex.rotationY = Math.PI;
    // scene.environmentTexture = envTex;
    // scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    return scene;
  }

  CreateCamera(): void {
    this.camera = new ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 3,
      2,
      new Vector3(0, 1, 0),
      this.scene
    );

    this.camera.attachControl(this.canvas, true);
    this.camera.wheelPrecision = 100;

    this.camera.minZ = 0.01;
    this.camera.lowerRadiusLimit = 0.5;
    this.camera.upperRadiusLimit = 2;
    this.camera.panningSensibility = 0;
  }

  async CreateJacket(): Promise<void> {
    let modelName: string;

    // Determine which model to load based on the background color
    if (this.mode === 'DAY') {
      modelName = 'DAY.glb'; // Load the day model for white background
      this.addHemisphericLight(); // Add light for DAY.glb
    } else if (this.mode === 'REFLECTIVE') {
      modelName = 'REFLECTIVE.glb';
      this.addHemisphericLight(); // Add light for DAY.glb
    } else if (this.mode === 'NIGHT') {
      modelName = 'NIGHT.glb';
      this.removeAllLights(); // No light for REFLECTIVE
    } else {
      modelName = 'DAY.glb'; // Assign a default model
      this.addHemisphericLight(); // Default light for DAY
    }

    // Load the selected model
    const { meshes } = await SceneLoader.ImportMeshAsync(
      '',
      './models/',
      modelName
    );

    console.log(meshes);
    let min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    let max = new Vector3(
      -Number.MAX_VALUE,
      -Number.MAX_VALUE,
      -Number.MAX_VALUE
    );

    meshes.forEach((mesh) => {
      if (mesh.getTotalVertices() > 0) {
        const boundingInfo = mesh.getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;

        min = Vector3.Minimize(min, boundingBox.minimumWorld);
        max = Vector3.Maximize(max, boundingBox.maximumWorld);
      }
    });

    const boundingCenter = Vector3.Center(min, max);
    this.camera.setTarget(boundingCenter);
    this.jacket = meshes[0]; // Assuming the jacket is the first mesh

    this.jacket.isVisible = true;
  }

  addHemisphericLight(): void {
    // Create the hemispheric light for DAY.glb if it's not already created
    if (!this.hemisphericLight) {
      this.hemisphericLight = new HemisphericLight(
        'hemisphericLight',
        new Vector3(0, 1, 0),
        this.scene
      );
      this.hemisphericLight.intensity = 0.7; // Adjust intensity as needed
    }
  }

  addSpotLightToModel(): void {
    const spotlights: SpotLight[] = [];

    const spotlightPositions = [
      new Vector3(0, 5, 0), // Above
      new Vector3(5, 0, 0), // Right
      new Vector3(-5, 0, 0), // Left
      new Vector3(0, 0, 5), // Front
      new Vector3(0, 0, -5), // Back
    ];

    spotlightPositions.forEach((position) => {
      const spotlight = new SpotLight(
        'spotlight' + position.toString(),
        position, // Light position (from different directions)
        Vector3.Zero().subtract(position), // Direction pointing towards the model
        Math.PI / 3, // Angle for the spotlight
        2, // Exponent for the spotlight falloff
        this.scene
      );
      spotlight.intensity = 5; // Increase intensity for stronger light effect
      spotlight.range = 20; // Adjust range to control how far the light reaches

      spotlights.push(spotlight);
    });

    // Optionally store the spotlights for later manipulation if needed
    this.spotlight = spotlights[0]; // Example of storing the first one if needed
  }

  removeAllLights(): void {
    // Dispose of all lights (for REFLECTIVE.glb)
    if (this.hemisphericLight) {
      this.hemisphericLight.dispose();
      this.hemisphericLight = undefined;
    }
    if (this.spotlight) {
      this.spotlight.dispose();
      this.spotlight = undefined;
    }
  }

  CreateMultipleSpheres(): void {
    const positions = [
      new Vector3(-0.055, 1.4, 0.14),
      new Vector3(0.17, 1.45, 0.14),
      new Vector3(-0.06, 1.52, 0.14),
      new Vector3(-0.21, 1.45, 0.14),
      new Vector3(-0.055, 1.16, 0.22),
      new Vector3(-0.33, 1.12, 0.1),
      new Vector3(0.26, 1, 0),
      new Vector3(0, 1.6, -0.15),
    ];

    const details = [
      '1: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pulvinar, ipsum sed interdum laoreet, sapien quam suscipit sapien, eget rhoncus enim orci sed augue. Aenean suscipit quam eu vehicula volutpat. Donec a enim velit. Sed non nisi nunc. Duis elementum ipsum sed quam commodo, eget dignissim tellus tempor. Integer feugiat eleifend lorem a rhoncus. Maecenas sed tempor ipsum. Vestibulum euismod orci a ligula porta, a accumsan ligula sodales. Morbi lobortis porttitor libero, id venenatis erat vehicula non.',
      '2: Maecenas luctus viverra mi a finibus. Nam eleifend, massa eu tincidunt sodales, nibh dui ullamcorper ex, quis feugiat dolor ex vel dolor. Phasellus leo magna, semper a malesuada sit amet, gravida quis purus. Nunc ultricies imperdiet urna, sollicitudin sollicitudin erat tristique ut. Integer sed viverra lorem, eget consequat ipsum. Aenean suscipit nisi a neque egestas viverra. Pellentesque facilisis lacinia mi, eleifend venenatis sem. Mauris nec nisl molestie, ultricies enim eu, bibendum urna. Nullam molestie quam ac ex vestibulum imperdiet. Nulla at justo dignissim, lacinia libero sed, varius lacus. Aenean risus enim, finibus id nunc id, scelerisque sodales massa. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Etiam tempor metus at commodo dignissim. Pellentesque vulputate leo nec risus tempor, vitae tincidunt sem tincidunt.',
      '3: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pulvinar, ipsum sed interdum laoreet, sapien quam suscipit sapien, eget rhoncus enim orci sed augue. Aenean suscipit quam eu vehicula volutpat. Donec a enim velit. Sed non nisi nunc. Duis elementum ipsum sed quam commodo, eget dignissim tellus tempor. Integer feugiat eleifend lorem a rhoncus. Maecenas sed tempor ipsum. Vestibulum euismod orci a ligula porta, a accumsan ligula sodales. Morbi lobortis porttitor libero, id venenatis erat vehicula non.',
      '4: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pulvinar, ipsum sed interdum laoreet, sapien quam suscipit sapien, eget rhoncus enim orci sed augue. Aenean suscipit quam eu vehicula volutpat. Donec a enim velit. Sed non nisi nunc. Duis elementum ipsum sed quam commodo, eget dignissim tellus tempor. Integer feugiat eleifend lorem a rhoncus. Maecenas sed tempor ipsum. Vestibulum euismod orci a ligula porta, a accumsan ligula sodales. Morbi lobortis porttitor libero, id venenatis erat vehicula non.',
      '5: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pulvinar, ipsum sed interdum laoreet, sapien quam suscipit sapien, eget rhoncus enim orci sed augue. Aenean suscipit quam eu vehicula volutpat. Donec a enim velit. Sed non nisi nunc. Duis elementum ipsum sed quam commodo, eget dignissim tellus tempor. Integer feugiat eleifend lorem a rhoncus. Maecenas sed tempor ipsum. Vestibulum euismod orci a ligula porta, a accumsan ligula sodales. Morbi lobortis porttitor libero, id venenatis erat vehicula non.',
      '6F: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pulvinar, ipsum sed interdum laoreet, sapien quam suscipit sapien, eget rhoncus enim orci sed augue. Aenean suscipit quam eu vehicula volutpat. Donec a enim velit. Sed non nisi nunc. Duis elementum ipsum sed quam commodo, eget dignissim tellus tempor. Integer feugiat eleifend lorem a rhoncus. Maecenas sed tempor ipsum. Vestibulum euismod orci a ligula porta, a accumsan ligula sodales. Morbi lobortis porttitor libero, id venenatis erat vehicula non.',
      '7: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pulvinar, ipsum sed interdum laoreet, sapien quam suscipit sapien, eget rhoncus enim orci sed augue. Aenean suscipit quam eu vehicula volutpat. Donec a enim velit. Sed non nisi nunc. Duis elementum ipsum sed quam commodo, eget dignissim tellus tempor. Integer feugiat eleifend lorem a rhoncus. Maecenas sed tempor ipsum. Vestibulum euismod orci a ligula porta, a accumsan ligula sodales. Morbi lobortis porttitor libero, id venenatis erat vehicula non.',
      '8: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pulvinar, ipsum sed interdum laoreet, sapien quam suscipit sapien, eget rhoncus enim orci sed augue. Aenean suscipit quam eu vehicula volutpat. Donec a enim velit. Sed non nisi nunc. Duis elementum ipsum sed quam commodo, eget dignissim tellus tempor. Integer feugiat eleifend lorem a rhoncus. Maecenas sed tempor ipsum. Vestibulum euismod orci a ligula porta, a accumsan ligula sodales. Morbi lobortis porttitor libero, id venenatis erat vehicula non.',
    ];

    const targetPoints = [
      new Vector3(0.35, -1, 0.18),
      new Vector3(0.4, 1.6, -0.8),
      new Vector3(-1.24, 1.6, -0.8),
      new Vector3(0.7, 1, -0.6),
      new Vector3(0.6, 0.6, -0.3),
      new Vector3(-0.6, -0.2, -0.16),
      new Vector3(-0.6, -0.8, 0.08),
      new Vector3(-0.6, -0.8, 0.08),
    ];

    // Define line length factors for each sphere
    const lineLengthFactors = [0.06, 0.1, 0.12, 0.075, 0.08, 0.1, 0.05, 0.04]; // Adjust as needed for each sphere

    // Define which spheres to create based on the mode
    let indicesToCreate: number[];
    if (this.mode === 'DAY') {
      indicesToCreate = [0, 1, 2, 3, 4, 5, 6, 7]; // Show all spheres
    } else if (this.mode === 'REFLECTIVE') {
      indicesToCreate = [0, 2, 6, 7]; // Show only A, B, C, D
    } else if (this.mode === 'NIGHT') {
      indicesToCreate = [0, 6, 7]; // Show only A, D, H
    } else {
      indicesToCreate = []; // Default to no spheres if mode is unrecognized
    }

    // Create spheres based on the selected indices
    indicesToCreate.forEach((index) => {
      this.CreateSphere(
        positions[index],
        details[index],
        targetPoints[index],
        lineLengthFactors[index]
      );
    });
  }

  CreateSphere(
    position: Vector3,
    info: string,
    targetPoint: Vector3,
    lineLengthFactor: number
  ): void {
    this.ball = MeshBuilder.CreateSphere('ball', { diameter: 0.05 });
    const ballMat = new StandardMaterial('ballMat', this.scene);
    ballMat.diffuseColor = new Color3(1, 0.5, 0);
    ballMat.specularColor = new Color3(0, 0, 0);
    ballMat.ambientColor = new Color3(1, 1, 1);
    ballMat.emissiveColor = new Color3(1, 0.5, 0);

    this.ball.material = ballMat;
    this.ball.position = position;

    const outerBall = MeshBuilder.CreateSphere('outerBall', { diameter: 0.08 });
    const outerBallMat = new StandardMaterial('outerBallMat', this.scene);
    outerBallMat.diffuseColor = new Color3(1, 0.65, 0);
    outerBallMat.alpha = 0.5;
    outerBallMat.specularColor = new Color3(0, 0, 0);
    outerBallMat.ambientColor = new Color3(1, 1, 1);
    outerBallMat.emissiveColor = new Color3(1, 0.8, 0);

    outerBall.material = outerBallMat;
    outerBall.position = position;

    outerBall.actionManager = new ActionManager(this.scene);
    outerBall.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        console.log('Outer ball clicked!');
        if (this.onBallClick) {
          this.onBallClick(info);
        }
      })
    );

    // Create the yellow line to the jacket
    this.CreateYellowLineToJacket(position, targetPoint, lineLengthFactor);

    // Check if this is Jacket G and create the second line
    if (info.includes('7')) {
      const secondTargetPoint = new Vector3(0.6, 1.2, 0.08); // Adjust this point as needed
      const secondLineLengthFactor = 0.17; // Adjust this factor as needed
      this.CreateYellowLineToJacket(
        position,
        secondTargetPoint,
        secondLineLengthFactor
      );
    }

    this.outerBalls.push(outerBall);
    this.ballDetails.push({ positon: position, info });

    this.AnimateBalls(this.ball, outerBall);
  }

  AnimateBalls(ball: AbstractMesh, outerBall: AbstractMesh): void {
    const scaleAnimation = new Animation(
      'scaleAnimation',
      'scaling',
      15,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const innerKeys = [
      { frame: 0, value: new Vector3(1, 1, 1) },
      { frame: 30, value: new Vector3(1.2, 1.2, 1.2) },
      { frame: 60, value: new Vector3(1, 1, 1) },
    ];

    scaleAnimation.setKeys(innerKeys);
    ball.animations.push(scaleAnimation);
    this.scene.beginAnimation(ball, 0, 60, true);

    const outerScaleAnimation = new Animation(
      'outerScaleAnimation',
      'scaling',
      15,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const outerKeys = [
      { frame: 0, value: new Vector3(1, 1, 1) },
      { frame: 30, value: new Vector3(1.2, 1.2, 1.2) },
      { frame: 60, value: new Vector3(1, 1, 1) },
    ];

    outerScaleAnimation.setKeys(outerKeys);
    outerBall.animations.push(outerScaleAnimation);
    this.scene.beginAnimation(outerBall, 0, 60, true);
  }

  CreateYellowLineToJacket(
    ballPosition: Vector3,
    targetPoint: Vector3,
    lineLengthFactor: number
  ): void {
    if (!this.jacket) return;

    // Adjust the end point of the line based on the lineLengthFactor
    const jacketPoint = targetPoint; // Assume this is where you want to connect to on the jacket
    const lineEndPoint = Vector3.Lerp(
      ballPosition,
      jacketPoint,
      lineLengthFactor
    ); // Adjust to make the line longer or shorter

    // Create the yellow line from the ball to the jacket
    const line = MeshBuilder.CreateLines(
      'line',
      {
        points: [ballPosition, lineEndPoint],
      },
      this.scene
    );

    // Set line color and make it visible
    line.color = new Color3(1, 0.8, 0);
  }
}
