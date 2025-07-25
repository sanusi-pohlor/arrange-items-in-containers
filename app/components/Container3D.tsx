'use client'

import React, { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Box, Edges } from '@react-three/drei'

// --- Interfaces and Constants ---
interface Parcel {
  id: string;
  name: string;
  size: [number, number, number];
  isCustom?: boolean;
  color?: string; // Add color property
}

const INITIAL_PARCEL_TYPES: Parcel[] = [
  { id: 's', name: 'กล่องเล็ก', size: [0.5, 0.5, 0.5], color: '#FF6347' }, // Tomato
  { id: 'm', name: 'กล่องกลาง', size: [1, 1, 1], color: '#4682B4' }, // SteelBlue
  { id: 'l', name: 'กล่องใหญ่', size: [1.5, 1.5, 1.5], color: '#32CD32' }, // LimeGreen
];

const CUSTOM_PARCEL_COLORS = [
    '#DAA520', // Goldenrod
    '#BA55D3', // MediumOrchid
    '#20B2AA', // LightSeaGreen
    '#FF69B4', // HotPink
    '#8A2BE2', // BlueViolet
    '#FF4500', // OrangeRed
    '#ADFF2F', // GreenYellow
    '#87CEEB', // SkyBlue
    '#FFD700', // Gold
    '#9932CC', // DarkOrchid
    '#00CED1', // DarkTurquoise
    '#FF1493', // DeepPink
    '#7B68EE', // MediumSlateBlue
    '#3CB371', // MediumSeaGreen
    '#FFA07A', // LightSalmon
    '#40E0D0', // Turquoise
    '#EE82EE', // Violet
    '#F08080', // LightCoral
    '#6A5ACD', // SlateBlue
    '#2E8B57', // SeaGreen
];
let customColorIndex = 0;

const INITIAL_CONTAINER_SIZE: [number, number, number] = [4, 2.5, 2.5];

interface RenderableParcel {
    size: [number, number, number];
    position: [number, number, number];
    color: string;
}

interface PlacementSummary {
    total: number;
    byType: { [name: string]: { count: number; size: string; } };
}

// --- Helper Functions ---
function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- 3D Components ---

function Container({ size }: { size: [number, number, number] }) {
  return (
    <Box args={size}>
      <meshStandardMaterial color={'#0055ff'} transparent opacity={0.2} />
    </Box>
  )
}

function Parcel({ position, size, color }: { position: [number, number, number], size: [number, number, number], color: string }) {
    return (
        <Box position={position} args={size}>
            <meshStandardMaterial color={color} transparent opacity={0.6} />
            <Edges />
        </Box>
    )
}

// --- Main Component ---

export default function Container3D() {
  const [selections, setSelections] = useState<{ [key: string]: number }>({ s: 0, m: 0, l: 0 });
  const [renderedParcels, setRenderedParcels] = useState<RenderableParcel[]>([]);
  const [containerSize, setContainerSize] = useState<[number, number, number]>(INITIAL_CONTAINER_SIZE);
  const [parcelTypes, setParcelTypes] = useState<Parcel[]>(INITIAL_PARCEL_TYPES);
  const [newParcel, setNewParcel] = useState({ name: '', w: 0.5, h: 0.5, d: 0.5 });
  const [unplacedParcels, setUnplacedParcels] = useState<{ size: [number, number, number] }[]>([]);
  const [summary, setSummary] = useState<PlacementSummary | null>(null);

  useEffect(() => {
    if (unplacedParcels.length > 0) {
        const summary = unplacedParcels
            .map(p => p.size.join('x'))
            .reduce((acc: { [key: string]: number }, size) => {
                acc[size] = (acc[size] || 0) + 1;
                return acc;
            }, {});

        const summaryString = Object.entries(summary)
            .map(([size, count]) => `${count} กล่องขนาด ${size}`)
            .join('\n');

        alert(`ไม่สามารถจัดเรียงพัสดุบางส่วนได้เนื่องจากพื้นที่ไม่เพียงพอ:\n\n${summaryString}`);
        setUnplacedParcels([]); // Clear after alert
    }
  }, [unplacedParcels]);


  const handleQuantityChange = (id: string, quantity: number) => {
    setSelections(prev => ({ ...prev, [id]: Math.max(0, quantity) }));
  };

  const handleContainerSizeChange = (index: number, value: number) => {
    const newSize = [...containerSize] as [number, number, number];
    newSize[index] = Math.max(0.1, value);
    setContainerSize(newSize);
    setRenderedParcels([]);
    setSummary(null);
  };

  const handleNewParcelInputChange = (field: string, value: string | number) => {
    setNewParcel(prev => ({ ...prev, [field]: value }));
  };

  const handleAddParcelType = () => {
    if (!newParcel.name || newParcel.w <= 0 || newParcel.h <= 0 || newParcel.d <= 0) {
        alert("กรุณากรอกข้อมูลกล่องพัสดุให้ครบถ้วนและถูกต้อง");
        return;
    }
    const newId = `custom-${Date.now()}`;
    const newType: Parcel = {
        id: newId,
        name: newParcel.name,
        size: [Number(newParcel.w), Number(newParcel.h), Number(newParcel.d)],
        isCustom: true,
        color: CUSTOM_PARCEL_COLORS[customColorIndex % CUSTOM_PARCEL_COLORS.length],
    };
    customColorIndex++;
    setParcelTypes(prev => [...prev, newType]);
    setNewParcel({ name: '', w: 0.5, h: 0.5, d: 0.5 }); // Reset form
  };

  const handleRemoveParcelType = (id: string) => {
    setParcelTypes(prev => prev.filter(p => p.id !== id));
    const newSelections = { ...selections };
    delete newSelections[id];
    setSelections(newSelections);
  };

  const handleResetAll = () => {
    setContainerSize(INITIAL_CONTAINER_SIZE);
    setParcelTypes(INITIAL_PARCEL_TYPES);
    setSelections({ s: 0, m: 0, l: 0 });
    setRenderedParcels([]);
    setSummary(null);
    setUnplacedParcels([]);
  };

  const handleArrangeItems = () => {
    let parcelsToPlace: { size: [number, number, number], type: Parcel }[] = [];
    parcelTypes.forEach(type => {
        const quantity = selections[type.id] || 0;
        for (let i = 0; i < quantity; i++) {
            parcelsToPlace.push({ size: type.size, type });
        }
    });

    // Shuffle before sorting to get different packing for same-sized items
    parcelsToPlace = shuffleArray(parcelsToPlace);

    parcelsToPlace.sort((a, b) => {
        const volumeA = a.size[0] * a.size[1] * a.size[2];
        const volumeB = b.size[0] * b.size[1] * b.size[2];
        return volumeB - volumeA;
    });

    const placedParcels: RenderableParcel[] = [];
    const unplacedForThisRun: { size: [number, number, number] }[] = [];
    const placedCuboids: { x1: number, y1: number, z1: number, x2: number, y2: number, z2: number }[] = [];
    const [contW, contH, contD] = containerSize;
    const container = { x1: -contW/2, y1: -contH/2, z1: -contD/2, x2: contW/2, y2: contH/2, z2: contD/2 };
    let anchorPoints: [number, number, number][] = [[container.x1, container.y1, container.z1]];
    const placementSummary: PlacementSummary = { total: 0, byType: {} };

    for (const parcel of parcelsToPlace) {
        const [pW, pH, pD] = parcel.size;
        let bestAnchorIndex = -1;

        for (let i = 0; i < anchorPoints.length; i++) {
            const [ax, ay, az] = anchorPoints[i];
            const [x1, y1, z1] = [ax, ay, az];
            const [x2, y2, z2] = [x1 + pW, y1 + pH, z1 + pD];

            if (x2 > container.x2 || y2 > container.y2 || z2 > container.z2) continue;

            let collides = false;
            for (const placed of placedCuboids) {
                if ((x1 < placed.x2 && x2 > placed.x1) && (y1 < placed.y2 && y2 > placed.y1) && (z1 < placed.z2 && z2 > placed.z1)) {
                    collides = true;
                    break;
                }
            }

            if (!collides) {
                bestAnchorIndex = i;
                break;
            }
        }

        if (bestAnchorIndex !== -1) {
            const [ax, ay, az] = anchorPoints[bestAnchorIndex];
            placedParcels.push({ size: parcel.size, position: [ax + pW/2, ay + pH/2, az + pD/2], color: parcel.type.color || '#00aaff' });
            placedCuboids.push({ x1: ax, y1: ay, z1: az, x2: ax + pW, y2: ay + pH, z2: az + pD });
            anchorPoints.splice(bestAnchorIndex, 1);
            anchorPoints.push([ax + pW, ay, az], [ax, ay + pH, az], [ax, ay, az + pD]);
            anchorPoints = anchorPoints.filter((v,i,a)=>a.findIndex(t=>(t[0]===v[0] && t[1]===v[1] && t[2]===v[2]))===i);
            // Re-sort anchor points to prioritize bottom-up, then front-to-back, then left-to-right
            anchorPoints.sort((a, b) => {
                if (a[1] !== b[1]) return a[1] - b[1]; // Sort by Y (height)
                if (a[2] !== b[2]) return a[2] - b[2]; // Sort by Z (depth)
                return a[0] - b[0]; // Sort by X (width)
            });

            placementSummary.total++;
            const typeName = parcel.type.name;
            if (!placementSummary.byType[typeName]) {
                placementSummary.byType[typeName] = { count: 0, size: parcel.size.join('x') };
            }
            placementSummary.byType[typeName].count++;

        } else {
            unplacedForThisRun.push(parcel);
        }
    }
    setRenderedParcels(placedParcels);
    setUnplacedParcels(unplacedForThisRun);
    setSummary(placementSummary);
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255, 255, 255, 0.9)', padding: '15px', borderRadius: '10px', zIndex: 10, width: '320px', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3>ตั้งค่า</h3>
              <button onClick={handleResetAll} style={{ background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', padding: '5px 10px' }}>รีเซ็ตทั้งหมด</button>
            </div>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ccc' }} />
            <h4>ขนาดตู้คอนเทนเนอร์ (เมตร)</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                {['กว้าง', 'สูง', 'ลึก'].map((label, index) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <label style={{ fontSize: '12px', marginBottom: '4px' }}>{label}</label>
                        <input type="number" step="0.1" value={containerSize[index]} onChange={(e) => handleContainerSizeChange(index, parseFloat(e.target.value))} style={{ width: '80px', padding: '5px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc' }}/>
                    </div>
                ))}
            </div>
            <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #ccc' }} />
            <h4>เพิ่มประเภทกล่องพัสดุ</h4>
            <input type="text" placeholder="ชื่อกล่อง" value={newParcel.name} onChange={e => handleNewParcelInputChange('name', e.target.value)} style={{ width: 'calc(100% - 12px)', padding: '6px', marginBottom: '5px', borderRadius: '4px', border: '1px solid #ccc' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <input type="number" placeholder="กว้าง" value={newParcel.w} onChange={e => handleNewParcelInputChange('w', e.target.value)} style={{ width: '30%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}/>
                <input type="number" placeholder="สูง" value={newParcel.h} onChange={e => handleNewParcelInputChange('h', e.target.value)} style={{ width: '30%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}/>
                <input type="number" placeholder="ลึก" value={newParcel.d} onChange={e => handleNewParcelInputChange('d', e.target.value)} style={{ width: '30%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}/>
            </div>
            <button onClick={handleAddParcelType} style={{ width: '100%', padding: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>เพิ่มกล่อง</button>
            <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #ccc' }} />
            <h4>เลือกจำนวนพัสดุ</h4>
            {parcelTypes.map(type => (
                <div key={type.id} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 'bold' }}>{type.name}</span>
                        <span style={{ fontSize: '12px', color: '#555' }}> ({type.size.join('x')})</span>
                    </div>
                    <input type="number" min="0" value={selections[type.id] || 0} onChange={(e) => handleQuantityChange(type.id, parseInt(e.target.value, 10))} style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc', marginRight: '5px' }}/>
                    {type.isCustom && <button onClick={() => handleRemoveParcelType(type.id)} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px' }}>X</button>}
                </div>
            ))}
            <button onClick={handleArrangeItems} style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>
                จัดเรียง / ลองรูปแบบใหม่
            </button>
            {summary && (
                <div style={{ marginTop: '15px', background: '#e9ecef', padding: '10px', borderRadius: '5px' }}>
                    <h4><strong>สรุปผลการจัดเรียง</strong></h4>
                    <p style={{ display: 'flex', justifyContent: 'space-between' }}><strong>จำนวนกล่องทั้งหมด:</strong> {summary.total} กล่อง</p>
                    <ul>
                        {Object.entries(summary.byType).map(([name, data]) => (
                            <li key={name} style={{ display: 'flex', justifyContent: 'space-between' }}><span><strong>{name}</strong> ({data.size}):</span> <span>{data.count} กล่อง</span></li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

      <Canvas>
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} />
        <pointLight position={[-10, -15, -10]} />
        <Container size={containerSize} />
        {renderedParcels.map((parcel, index) => (
            <Parcel key={index} position={parcel.position} size={parcel.size} color={parcel.color} />
        ))}
        <OrbitControls />
      </Canvas>
    </div>
  )
}