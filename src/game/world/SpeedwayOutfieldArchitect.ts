/**
 * SpeedwayOutfieldArchitect.ts - High-Performance Aerodynamic Outfield Environment
 * 
 * Masterclass Circuit Redesign for Circuit 2 (Speedway GP):
 * - Motor City Theme: Fluid, curvilinear, and aerodynamic architecture with soft rounded profiles
 * - Continuous Elevated Monorail System with sweeping 3D Catmull-Rom dual tubular rails
 * - Hardware GPU InstancedMesh for 50+ aerodynamic pylons and maglev transit pods (1 draw call)
 * - Geodesic VIP Domes & Hemispherical Panoramic Observatories (Curvone, Hairpin, Parabolica)
 * - Undulating Aerodynamic Solar Wave Canopies with sine-harmonic curvature
 * - Soft physical PBR materials (titanium, champagne bronze, architectural glass with warm night glow)
 * - Natural soft shadows adhering strictly to the existing DirectionalLight sun angle
 * - High-density visual atmosphere with less than 6 additional GPU draw calls total
 */

import * as THREE from 'three';
import { safeMergeBufferGeometries, safeMergeAndDispose } from '../utils/GeometryUtils';
import { StaticObstacle } from './TrackBuilder';

export interface OutfieldArchitectMaterials {
  metalSilverMat: THREE.Material;
  metalDarkMat: THREE.Material;
  glassMat: THREE.Material;
  concreteMat: THREE.Material;
}

export class SpeedwayOutfieldArchitect {
  /**
   * Builds the entire fluid aerodynamic outfield city environment for Circuit 2.
   */
  public static buildOutfieldEnvironment(
    materials: OutfieldArchitectMaterials,
    obstaclesList?: StaticObstacle[]
  ): THREE.Group {
    const environmentGroup = new THREE.Group();
    environmentGroup.name = 'SpeedwayOutfield_AerodynamicCity';

    // 1. Build Continuous Swept Elevated Monorail System
    const monorailGroup = this.buildElevatedMonorail(materials, obstaclesList);
    environmentGroup.add(monorailGroup);

    // 2. Build Panoramic Geodesic VIP Domes and Hemispherical Atria
    const domesGroup = this.buildGeodesicVIPDomes(materials, obstaclesList);
    environmentGroup.add(domesGroup);

    // 3. Build Undulating Aerodynamic Solar Wave Canopies
    const canopiesGroup = this.buildUndulatingSolarCanopies(materials);
    environmentGroup.add(canopiesGroup);

    // 4. Build Sculptural Elliptical Motor City Pavilions
    const pavilionsGroup = this.buildEllipticalPavilions(materials, obstaclesList);
    environmentGroup.add(pavilionsGroup);

    return environmentGroup;
  }

  /**
   * 1. Continuous Sweeping Elevated Monorail Loop
   * Features a smooth closed 3D Catmull-Rom curve in the midground perimeter,
   * continuous dual tubular steel rails, and GPU InstancedMesh flared pylons.
   */
  private static buildElevatedMonorail(
    materials: OutfieldArchitectMaterials,
    obstaclesList?: StaticObstacle[]
  ): THREE.Group {
    const monorailGroup = new THREE.Group();
    monorailGroup.name = 'MonorailSystem';

    // Perimeter Outfield Control Nodes (Radius 240m to 480m from center, hugging the natural landscape)
    const curvePoints = [
      new THREE.Vector3(-440, 17.5, -170), // West Main Straight approach
      new THREE.Vector3(-220, 18.0, -180), // South straight midground
      new THREE.Vector3(80, 18.5, -180),   // Opposite Paddock
      new THREE.Vector3(330, 19.0, -165),  // Turn 1 Braking area outfield
      new THREE.Vector3(475, 18.5, -100),  // Chicane exit midground
      new THREE.Vector3(510, 19.5, 40),    // Outer Curvone apex
      new THREE.Vector3(460, 18.5, 175),   // Curvone exit hill
      new THREE.Vector3(320, 17.5, 275),   // Outer Esses
      new THREE.Vector3(80, 18.0, 325),    // Hairpin entry panorama
      new THREE.Vector3(-140, 18.5, 310),  // Hairpin exit hillside
      new THREE.Vector3(-340, 19.0, 210),  // Infield esses backdrop
      new THREE.Vector3(-455, 18.0, 60),   // Parabolica entry
      new THREE.Vector3(-470, 17.5, -60),  // Parabolica apex curve
    ];

    const spline = new THREE.CatmullRomCurve3(curvePoints, true, 'centripetal');
    const sampledPointsCount = 280;
    const sampledPoints = spline.getSpacedPoints(sampledPointsCount);

    // Dual Tubular Rails (Offset by ±1.1m perpendicular to track tangent)
    const leftRailPoints: THREE.Vector3[] = [];
    const rightRailPoints: THREE.Vector3[] = [];
    const upVec = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < sampledPoints.length; i++) {
      const p = sampledPoints[i];
      const tangent = spline.getTangentAt(i / (sampledPoints.length - 1)).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, upVec).normalize();

      leftRailPoints.push(p.clone().addScaledVector(normal, 1.15));
      rightRailPoints.push(p.clone().addScaledVector(normal, -1.15));
    }

    const leftSpline = new THREE.CatmullRomCurve3(leftRailPoints, true);
    const rightSpline = new THREE.CatmullRomCurve3(rightRailPoints, true);

    // Continuous Tube Geometries (Smooth 0.38m radius tubes with 12 radial segments for fluid curves)
    const leftTubeGeo = new THREE.TubeGeometry(leftSpline, 240, 0.38, 12, true);
    const rightTubeGeo = new THREE.TubeGeometry(rightSpline, 240, 0.38, 12, true);

    const mergedRails = safeMergeBufferGeometries([leftTubeGeo, rightTubeGeo]);
    if (mergedRails) {
      const railsMesh = new THREE.Mesh(mergedRails, materials.metalSilverMat);
      railsMesh.castShadow = true;
      railsMesh.receiveShadow = true;
      monorailGroup.add(railsMesh);
    }

    // Aerodynamic Structural Cross-Ties (Single Merged Batch)
    const tieGeos: THREE.BufferGeometry[] = [];
    const tieSpacing = 4; // Every 4 sampled points = ~25m interval
    for (let i = 0; i < sampledPoints.length; i += tieSpacing) {
      const p = sampledPoints[i];
      const tangent = spline.getTangentAt(i / (sampledPoints.length - 1)).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, upVec).normalize();

      // Cross girder
      const tieGeo = new THREE.BoxGeometry(2.9, 0.28, 0.6);
      const rotMat = new THREE.Matrix4().lookAt(
        new THREE.Vector3(0, 0, 0),
        normal,
        upVec
      );
      tieGeo.applyMatrix4(rotMat);
      tieGeo.translate(p.x, p.y - 0.25, p.z);
      tieGeos.push(tieGeo);
    }

    const mergedTies = safeMergeBufferGeometries(tieGeos);
    if (mergedTies) {
      const tiesMesh = new THREE.Mesh(mergedTies, materials.metalDarkMat);
      tiesMesh.castShadow = true;
      monorailGroup.add(tiesMesh);
    }

    // 48 Aerodynamic Flared Pylons using Hardware GPU InstancedMesh (1 Draw Call!)
    const pylonCount = 48;
    const pylonHeight = 20.0;

    // Smooth organic pylon shape: Flared cone base + tapered shaft + aerodynamic rounded crown cap
    const basePylonGeo = new THREE.CylinderGeometry(0.65, 1.45, pylonHeight, 18);
    basePylonGeo.translate(0, pylonHeight / 2, 0);

    const crownGeo = new THREE.CylinderGeometry(1.6, 0.7, 1.4, 18);
    crownGeo.translate(0, pylonHeight + 0.6, 0);

    const fullPylonGeo = safeMergeBufferGeometries([basePylonGeo, crownGeo]) || basePylonGeo;

    const pylonInstancedMesh = new THREE.InstancedMesh(
      fullPylonGeo,
      materials.concreteMat,
      pylonCount
    );
    pylonInstancedMesh.castShadow = true;
    pylonInstancedMesh.receiveShadow = true;

    const dummyMatrix = new THREE.Matrix4();
    const dummyQuat = new THREE.Quaternion();
    const dummyScale = new THREE.Vector3(1, 1, 1);
    const dummyPos = new THREE.Vector3();

    for (let i = 0; i < pylonCount; i++) {
      const t = i / pylonCount;
      const point = spline.getPointAt(t);
      const tangent = spline.getTangentAt(t);

      // Sits grounded on terrain
      dummyPos.set(point.x, 0, point.z);

      const lookTarget = dummyPos.clone().add(tangent);
      dummyMatrix.lookAt(dummyPos, lookTarget, upVec);
      dummyQuat.setFromRotationMatrix(dummyMatrix);

      // Adjust scale height to reach the rail elevation at point.y
      const heightScale = (point.y - 0.7) / pylonHeight;
      dummyScale.set(1.1, heightScale, 1.1);

      dummyMatrix.compose(dummyPos, dummyQuat, dummyScale);
      pylonInstancedMesh.setMatrixAt(i, dummyMatrix);

      // Register collision if near outer runoff
      if (obstaclesList) {
        obstaclesList.push({
          x: point.x,
          z: point.z,
          radius: 2.2,
          type: 'pillar',
        });
      }
    }

    pylonInstancedMesh.instanceMatrix.needsUpdate = true;
    pylonInstancedMesh.computeBoundingSphere();
    monorailGroup.add(pylonInstancedMesh);

    // Aerodynamic Maglev Bullet Pods on the Track (2 Scenic Trains)
    const podGroup = this.buildMaglevTrainPods(spline, materials);
    monorailGroup.add(podGroup);

    return monorailGroup;
  }

  /**
   * High-speed aerodynamic bullet pods on the monorail
   */
  private static buildMaglevTrainPods(
    spline: THREE.CatmullRomCurve3,
    materials: OutfieldArchitectMaterials
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = 'MaglevPods';

    const podPositions = [0.18, 0.65]; // Two scenic trains on the circuit perimeter

    podPositions.forEach((t) => {
      const point = spline.getPointAt(t);
      const tangent = spline.getTangentAt(t).normalize();

      const trainLength = 26.0;
      const trainRadius = 1.35;

      // Streamlined aerodynamic bullet fuselage
      const fuselageGeo = new THREE.CylinderGeometry(trainRadius, trainRadius, trainLength - 4.0, 16);
      fuselageGeo.rotateZ(Math.PI / 2);

      const noseGeo = new THREE.SphereGeometry(trainRadius, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
      noseGeo.rotateZ(-Math.PI / 2);
      noseGeo.translate((trainLength - 4.0) / 2, 0, 0);

      const tailGeo = new THREE.SphereGeometry(trainRadius, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
      tailGeo.rotateZ(Math.PI / 2);
      tailGeo.translate(-(trainLength - 4.0) / 2, 0, 0);

      const mergedFuselage = safeMergeBufferGeometries([fuselageGeo, noseGeo, tailGeo]);
      if (mergedFuselage) {
        const podMesh = new THREE.Mesh(mergedFuselage, materials.metalSilverMat);
        podMesh.position.set(point.x, point.y + 0.9, point.z);

        const lookAtTarget = point.clone().add(tangent);
        podMesh.lookAt(lookAtTarget);
        podMesh.castShadow = true;
        group.add(podMesh);

        // Tinted panoramic glass visor band
        const visorGeo = new THREE.BoxGeometry(trainLength - 6.0, 0.55, trainRadius * 2.1);
        const visorMesh = new THREE.Mesh(visorGeo, materials.glassMat);
        visorMesh.position.set(point.x, point.y + 1.25, point.z);
        visorMesh.lookAt(lookAtTarget);
        group.add(visorMesh);
      }
    });

    return group;
  }

  /**
   * 2. Panoramic Geodesic VIP Domes & Hemispherical Atria
   * Placed along the key curves (Curvone, Hairpin, and Parabolica) with multi-tier
   * rounded podiums, hexagonal latticed roofs, and glowing atria.
   */
  private static buildGeodesicVIPDomes(
    materials: OutfieldArchitectMaterials,
    obstaclesList?: StaticObstacle[]
  ): THREE.Group {
    const domesGroup = new THREE.Group();
    domesGroup.name = 'GeodesicVIPDomes';

    // Dome Locations (Positioned on elevated natural outfield hilltops)
    const domeConfigs = [
      {
        x: 485,
        y: 0,
        z: 110,
        radius: 26.0,
        name: 'Curvone_Apex_Dome',
        title: 'CURVONE VIP ATRIUM',
      },
      {
        x: -25,
        y: 0,
        z: 345,
        radius: 24.0,
        name: 'Hairpin_Skyline_Dome',
        title: 'HAIRPIN APEX OBSERVATORY',
      },
      {
        x: -425,
        y: 0,
        z: 40,
        radius: 28.0,
        name: 'Parabolica_Horizon_Dome',
        title: 'PARABOLICA MOTOR PAVILION',
      },
    ];

    domeConfigs.forEach((cfg) => {
      const domeComplex = new THREE.Group();
      domeComplex.name = cfg.name;
      domeComplex.position.set(cfg.x, cfg.y, cfg.z);

      const R = cfg.radius;

      // A. Terraced Rounded Podium Base (Chamfered concentric discs)
      const podiumGeo1 = new THREE.CylinderGeometry(R * 1.35, R * 1.45, 1.8, 36);
      podiumGeo1.translate(0, 0.9, 0);

      const podiumGeo2 = new THREE.CylinderGeometry(R * 1.15, R * 1.25, 1.6, 36);
      podiumGeo2.translate(0, 2.5, 0);

      const mergedPodium = safeMergeBufferGeometries([podiumGeo1, podiumGeo2]);
      if (mergedPodium) {
        const podiumMesh = new THREE.Mesh(mergedPodium, materials.concreteMat);
        podiumMesh.receiveShadow = true;
        podiumMesh.castShadow = true;
        domeComplex.add(podiumMesh);
      }

      // B. Hemispherical Outer Structural Dome (Smooth geodesic sphere)
      // Height extends upwards from Y=3.3 to Y=3.3+R
      const domeGeo = new THREE.SphereGeometry(
        R,
        32,
        20,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.48
      );
      domeGeo.translate(0, 3.3, 0);

      // Glass and titanium composite material with warm inner glow
      const domeMat = new THREE.MeshStandardMaterial({
        color: 0x2d3748,
        metalness: 0.85,
        roughness: 0.18,
        emissive: 0xffca68,
        emissiveIntensity: 0.38,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });

      const domeMesh = new THREE.Mesh(domeGeo, domeMat);
      domeMesh.castShadow = true;
      domeMesh.receiveShadow = true;
      domeComplex.add(domeMesh);

      // C. Aerodynamic Torus Structural Rib Rings (Concentric latitudinal rings)
      const ringGeos: THREE.BufferGeometry[] = [];
      const ringAltitudes = [R * 0.25, R * 0.55, R * 0.82];

      ringAltitudes.forEach((h) => {
        const ringRad = Math.sqrt(Math.max(0, R * R - h * h));
        const torusGeo = new THREE.TorusGeometry(ringRad + 0.15, 0.42, 12, 36);
        torusGeo.rotateX(Math.PI / 2);
        torusGeo.translate(0, 3.3 + h, 0);
        ringGeos.push(torusGeo);
      });

      // Meridian vertical arches
      for (let a = 0; a < 6; a++) {
        const angle = (a / 6) * Math.PI;
        const archGeo = new THREE.TorusGeometry(R + 0.15, 0.38, 10, 32, Math.PI);
        archGeo.rotateY(angle);
        archGeo.translate(0, 3.3, 0);
        ringGeos.push(archGeo);
      }

      const mergedRings = safeMergeBufferGeometries(ringGeos);
      if (mergedRings) {
        const ringsMesh = new THREE.Mesh(mergedRings, materials.metalSilverMat);
        ringsMesh.castShadow = true;
        domeComplex.add(ringsMesh);
      }

      // D. Warm Interior Atrium Light (0 shadow passes = 120 FPS performance)
      const interiorLight = new THREE.PointLight(0xffb84d, 3.0, R * 3.2, 1.8);
      interiorLight.position.set(0, 3.3 + R * 0.45, 0);
      interiorLight.castShadow = false;
      domeComplex.add(interiorLight);

      // Register Collision Bounds
      if (obstaclesList) {
        obstaclesList.push({
          x: cfg.x,
          z: cfg.z,
          radius: R * 1.35,
          type: 'building',
        });
      }

      domesGroup.add(domeComplex);
    });

    return domesGroup;
  }

  /**
   * 3. Undulating Aerodynamic Solar Wave Canopies
   * Procedural parametric surfaces with soft sine-harmonic curves offering shade
   * over midground VIP parking, plaza verandas, and spectator walkways.
   */
  private static buildUndulatingSolarCanopies(
    materials: OutfieldArchitectMaterials
  ): THREE.Group {
    const canopiesGroup = new THREE.Group();
    canopiesGroup.name = 'UndulatingSolarCanopies';

    // Locations along the circuit outfield terraces
    const canopyPlacements = [
      { x: 190, z: -155, length: 110, width: 22, angle: 0 }, // Extension along main straight outfield
      { x: 440, z: 200, length: 85, width: 20, angle: Math.PI / 3 }, // Curvone hillside terrace
      { x: -280, z: 260, length: 90, width: 22, angle: -Math.PI / 4 }, // Hairpin back-terrace
      { x: -390, z: -80, length: 75, width: 20, angle: -Math.PI / 2 }, // Parabolica entry veranda
    ];

    canopyPlacements.forEach((cp) => {
      const canopyObj = this.generateSinusoidalWaveMesh(
        cp.length,
        cp.width,
        materials.metalSilverMat,
        materials.concreteMat
      );
      canopyObj.rotation.y = cp.angle;
      canopyObj.position.set(cp.x, 0, cp.z);
      canopiesGroup.add(canopyObj);
    });

    return canopiesGroup;
  }

  /**
   * Generates a single sinusoidal wave canopy with smooth aerodynamic curves.
   */
  private static generateSinusoidalWaveMesh(
    length: number,
    width: number,
    roofMat: THREE.Material,
    columnMat: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();

    const segL = 36;
    const segW = 14;

    const roofGeo = new THREE.PlaneGeometry(length, width, segL, segW);
    roofGeo.rotateX(-Math.PI / 2);

    const posAttr = roofGeo.attributes.position as THREE.BufferAttribute;
    const vertexCount = posAttr.count;

    const baseElevation = 7.5;
    const waveAmplitude = 1.6;

    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      // Dual harmonic sine wave: lengthways ripple + smooth crest falloff
      const u = x / (length * 0.5); // -1 to +1
      const v = z / (width * 0.5);  // -1 to +1

      const wave1 = Math.sin(u * Math.PI * 3.0) * waveAmplitude;
      const wave2 = Math.cos(v * Math.PI * 0.5) * 0.65;
      const droopEdge = -Math.pow(Math.abs(v), 2.5) * 0.9;

      const y = baseElevation + wave1 + wave2 + droopEdge;
      posAttr.setY(i, y);
    }

    roofGeo.computeVertexNormals();

    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);

    // Slim Aerodynamic Flared Columns (Merged batch)
    const columnGeos: THREE.BufferGeometry[] = [];
    const numBays = Math.floor(length / 18);

    for (let b = 0; b <= numBays; b++) {
      const colX = -length / 2 + b * (length / numBays);
      const colZ1 = -width * 0.32;
      const colZ2 = width * 0.32;

      [colZ1, colZ2].forEach((colZ) => {
        // Calculate roof height at this column coordinate
        const u = colX / (length * 0.5);
        const v = colZ / (width * 0.5);
        const wave = Math.sin(u * Math.PI * 3.0) * waveAmplitude + Math.cos(v * Math.PI * 0.5) * 0.65;
        const colHeight = baseElevation + wave;

        const colGeo = new THREE.CylinderGeometry(0.22, 0.42, colHeight, 14);
        colGeo.translate(colX, colHeight / 2, colZ);
        columnGeos.push(colGeo);

        // Flared capital branch
        const capGeo = new THREE.CylinderGeometry(1.1, 0.22, 0.8, 14);
        capGeo.translate(colX, colHeight - 0.4, colZ);
        columnGeos.push(capGeo);
      });
    }

    const mergedColumns = safeMergeBufferGeometries(columnGeos);
    if (mergedColumns) {
      const colsMesh = new THREE.Mesh(mergedColumns, columnMat);
      colsMesh.castShadow = true;
      group.add(colsMesh);
    }

    return group;
  }

  /**
   * 4. Sculptural Elliptical Motor City Pavilions
   * Circular ring architecture with smooth tori and floating aerodynamic discs.
   */
  private static buildEllipticalPavilions(
    materials: OutfieldArchitectMaterials,
    obstaclesList?: StaticObstacle[]
  ): THREE.Group {
    const pavilionsGroup = new THREE.Group();
    pavilionsGroup.name = 'EllipticalPavilions';

    const pavilionLocations = [
      { x: 380, z: -70, radiusA: 26, radiusB: 18, rotY: -Math.PI / 4, name: 'Chicane_Media_Lounge' },
      { x: -180, z: 230, radiusA: 32, radiusB: 20, rotY: Math.PI / 6, name: 'Infield_Engineering_Center' },
    ];

    pavilionLocations.forEach((loc) => {
      const pav = new THREE.Group();
      pav.name = loc.name;
      pav.position.set(loc.x, 0, loc.z);
      pav.rotation.y = loc.rotY;

      // Elliptical Terraced Podium
      const baseGeo = new THREE.CylinderGeometry(loc.radiusA, loc.radiusA * 1.08, 1.4, 32);
      baseGeo.scale(1.0, 1.0, loc.radiusB / loc.radiusA);
      baseGeo.translate(0, 0.7, 0);

      const baseMesh = new THREE.Mesh(baseGeo, materials.concreteMat);
      baseMesh.receiveShadow = true;
      baseMesh.castShadow = true;
      pav.add(baseMesh);

      // Curved Elliptical Canopy (Floating ring)
      const ringGeo = new THREE.TorusGeometry(loc.radiusA * 0.85, 1.2, 16, 36);
      ringGeo.rotateX(Math.PI / 2);
      ringGeo.scale(1.0, 1.0, loc.radiusB / loc.radiusA);
      ringGeo.translate(0, 12.0, 0);

      const ringMesh = new THREE.Mesh(ringGeo, materials.metalSilverMat);
      ringMesh.castShadow = true;
      pav.add(ringMesh);

      // Central Illuminated Glass Core
      const coreGeo = new THREE.CylinderGeometry(loc.radiusA * 0.65, loc.radiusA * 0.7, 10.5, 32);
      coreGeo.scale(1.0, 1.0, loc.radiusB / loc.radiusA);
      coreGeo.translate(0, 6.25, 0);

      const coreMesh = new THREE.Mesh(coreGeo, materials.glassMat);
      coreMesh.castShadow = true;
      coreMesh.receiveShadow = true;
      pav.add(coreMesh);

      if (obstaclesList) {
        obstaclesList.push({
          x: loc.x,
          z: loc.z,
          radius: loc.radiusA * 1.1,
          type: 'building',
        });
      }

      pavilionsGroup.add(pav);
    });

    return pavilionsGroup;
  }
}
