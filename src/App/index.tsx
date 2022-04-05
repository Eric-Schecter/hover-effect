import React, { useRef, useEffect, useState } from 'react';
import styles from './index.module.scss';
import {
  Mesh, PerspectiveCamera, PlaneBufferGeometry,
  Scene, ShaderMaterial, sRGBEncoding, Texture, Vector2, WebGLRenderer
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import fragment from './shader/fragment.frag';
import vertex from './shader/vertex.vert';
import fragmentTexture from './shader/fragmentTexture.frag';

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

type NodeData = {
  width: number,
  height: number,
  texture: Texture,
}

class World {
  private composer: EffectComposer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private timer = 0;
  private geometry = new PlaneBufferGeometry(1, 1);
  private material = new ShaderMaterial({
    uniforms: {
      texture1: { value: null },
      uResolution: { value: new Vector2() },
    },
    vertexShader: vertex,
    fragmentShader: fragmentTexture,
  })
  private _queue: any[] = [];
  private shaderpass: ShaderPass;
  private mouseTarget = new Vector2();
  private dir = new Vector2();
  constructor(container: HTMLDivElement) {
    const { offsetWidth: width, offsetHeight: height } = container;
    const renderer = new WebGLRenderer({
      antialias: true,
    });
    renderer.outputEncoding = sRGBEncoding;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.append(renderer.domElement);

    this.camera = new PerspectiveCamera(70, width / height, 0.001, 1000);
    this.camera.position.set(0, 0, 400);
    this.scene = new Scene();
    const resolution = new Vector2(1, width / height);

    this.composer = new EffectComposer(renderer);
    const renderpass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderpass)

    this.shaderpass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uResolution: { value: resolution },
        uMouse: { value: new Vector2() },
        uVelo: { value: new Vector2() },
        uMode: { value: 1 },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    this.shaderpass.renderToScreen = true;

    this.composer.addPass(this.shaderpass);

  }
  private add = (node: NodeData) => {
    const { width, height, texture } = node;
    const material = this.material.clone() as ShaderMaterial;
    texture.needsUpdate = true;
    material.uniforms.texture1.value = texture;
    const mesh = new Mesh(this.geometry, material);
    mesh.scale.set(width, height, 1);
    this.scene.add(mesh);
  }
  public draw = () => {
    while (this._queue.length) {
      const node = this._queue.pop();
      this.add(node);
    }
    const speed = 0.05;
    const uMouse = this.shaderpass.uniforms.uMouse.value;
    this.dir.copy(this.mouseTarget).sub(uMouse).clampLength(0, speed);
    const v = this.dir.length() * 20;
    this.shaderpass.uniforms.uMouse.value.add(this.dir);
    this.shaderpass.uniforms.uVelo.value = v;
    this.composer.render();
    this.timer = requestAnimationFrame(this.draw);
  }
  public move = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { offsetWidth, offsetHeight } = target;
    this.mouseTarget.set(
      e.clientX / offsetWidth,
      1 - e.clientY / offsetHeight
    )
  }
  public chagneMode = (mode: number) => {
    this.shaderpass.uniforms.uMode.value = mode;
  }
  public dispose = () => {
    cancelAnimationFrame(this.timer);
  }
  public set queue(value: any[]) {
    this._queue = value;
  }
}

export const App = () => {
  const ref = useRef<HTMLDivElement>(null);
  const refWorld = useRef<World>();
  const refQueue = useRef<any[]>([]);
  useEffect(() => {
    if (!ref.current) { return }
    const container = ref.current;
    refWorld.current = new World(container);
    refWorld.current.queue = refQueue.current;
    refWorld.current.draw();
    return () => refWorld.current?.dispose();
  }, [ref])

  const load = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const texture = new Texture(e.currentTarget);
    const { width, height } = e.currentTarget.getBoundingClientRect();
    refQueue.current.push({
      texture,
      width,
      height
    })
  }

  const [selected, setSelected] = useState(1);
  const click = (i: number) => {
    setSelected(i+1);
    refWorld.current?.chagneMode(i + 1)
  }
  return <div className={styles.container}>
    <div className={styles.divLayer} >
      <div className={styles.imgContainer}>
        <img alt='img' src='paper1.jpg' onLoad={load} />
      </div>
    </div>
    <div
      className={styles.canvasLayer}
      ref={ref}
      onMouseMove={e => refWorld.current?.move(e)}
    />
    <div
      className={styles.options}
    >
      {['color', 'zoom', 'random'].map((v, i) =>
        <div
          key={i}
          onClick={() => click(i)}
          className={(i + 1) === selected ? styles.selected : ''}
        >{v}</div>
      )}
    </div>
  </div>
}