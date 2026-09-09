import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { Character, Relationship, CharacterArcNode, ArcNodeType } from '../../types/novel';
import { CHARACTER_ROLE_LABELS, ARC_NODE_TYPES, ARC_NODE_COLORS } from '../../types/novel';

interface CharacterRelationshipGraphProps {
  characters: Character[];
  chapters: { id: string; title: string }[];
  onCharacterSelect: (characterId: string) => void;
  onRelationshipAdd: (fromId: string, toId: string, relationship: Relationship) => void;
  onRelationshipDelete: (characterId: string, targetId: string) => void;
  onCharacterArcUpdate: (characterId: string, arc: { nodes: CharacterArcNode[] }) => void;
}

interface GraphNode {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  fixed: boolean;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  description?: string;
}

const ROLE_COLORS: Record<string, string> = {
  protagonist: '#3b82f6',
  supporting: '#10b981',
  antagonist: '#ef4444',
  extra: '#94a3b8',
};

const CharacterRelationshipGraph: React.FC<CharacterRelationshipGraphProps> = ({
  characters,
  chapters,
  onCharacterSelect,
  onRelationshipAdd,
  onRelationshipDelete,
  onCharacterArcUpdate,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [newRelationTarget, setNewRelationTarget] = useState('');
  const [newRelationType, setNewRelationType] = useState('');
  const [showArcView, setShowArcView] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedArcCharacter, setSelectedArcCharacter] = useState<string | null>(null);
  const [showArcNodeModal, setShowArcNodeModal] = useState(false);
  const [editingArcNode, setEditingArcNode] = useState<CharacterArcNode | null>(null);
  const [arcNodeForm, setArcNodeForm] = useState({
    title: '',
    description: '',
    arcType: 'turning_point' as ArcNodeType,
    chapterId: '',
  });

  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const characterAppearances = useMemo(() => {
    const map = new Map<string, number>();
    for (const char of characters) {
      map.set(char.id, char.relationships.length);
    }
    return map;
  }, [characters]);

  const getContainerSize = useCallback(() => {
    const el = canvasRef.current;
    return {
      width: el?.clientWidth || 800,
      height: el?.clientHeight || 600,
    };
  }, []);

  useEffect(() => {
    const { width, height } = getContainerSize();
    const centerX = width / 2;
    const centerY = height / 2;

    const protagonists = characters.filter((c) => c.role === 'protagonist');
    const others = characters.filter((c) => c.role !== 'protagonist');

    const newNodes: GraphNode[] = [];

    protagonists.forEach((char, idx) => {
      const angle = protagonists.length > 1
        ? (2 * Math.PI * idx) / protagonists.length
        : 0;
      const radius = protagonists.length > 1 ? 80 : 0;
      newNodes.push({
        id: char.id,
        name: char.name,
        role: char.role,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        radius: 24 + (characterAppearances.get(char.id) || 0) * 2,
        color: ROLE_COLORS[char.role] || ROLE_COLORS.extra,
        fixed: false,
      });
    });

    others.forEach((char, index) => {
      const angle = (2 * Math.PI * index) / others.length;
      const radius = 150 + Math.random() * 50;
      newNodes.push({
        id: char.id,
        name: char.name,
        role: char.role,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        radius: 20 + (characterAppearances.get(char.id) || 0) * 2,
        color: ROLE_COLORS[char.role] || ROLE_COLORS.extra,
        fixed: false,
      });
    });

    const newEdges: GraphEdge[] = [];
    const edgeSet = new Set<string>();

    for (const char of characters) {
      for (const rel of char.relationships) {
        if (characters.some((c) => c.id === rel.targetCharacterId)) {
          const edgeKey = `${char.id}->${rel.targetCharacterId}`;
          const reverseEdgeKey = `${rel.targetCharacterId}->${char.id}`;

          if (!edgeSet.has(edgeKey)) {
            newEdges.push({
              source: char.id,
              target: rel.targetCharacterId,
              type: rel.type,
              description: rel.description,
            });
            edgeSet.add(edgeKey);
          }

          if (edgeSet.has(reverseEdgeKey)) {
            const existingEdge = newEdges.find(
              (e) => e.source === rel.targetCharacterId && e.target === char.id
            );
            if (existingEdge) {
              existingEdge.type = `${existingEdge.type} / ${rel.type}`;
            }
          }
        }
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [characters, characterAppearances, getContainerSize]);

  useEffect(() => {
    if (nodes.length === 0) return;

    setIsSimulating(true);
    let stableFrames = 0;
    const maxFrames = 300;
    let frameCount = 0;

    const interval = setInterval(() => {
      frameCount++;

      if (frameCount > maxFrames) {
        setIsSimulating(false);
        clearInterval(interval);
        return;
      }

      setNodes((prevNodes) => {
        const currentNodes = prevNodes.map((node) => ({ ...node }));
        const { width, height } = getContainerSize();
        const centerX = width / 2;
        const centerY = height / 2;

        let totalMovement = 0;

        for (let i = 0; i < currentNodes.length; i++) {
          for (let j = i + 1; j < currentNodes.length; j++) {
            const dx = currentNodes[j].x - currentNodes[i].x;
            const dy = currentNodes[j].y - currentNodes[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDistance = currentNodes[i].radius + currentNodes[j].radius + 30;

            if (distance < minDistance) {
              const force = ((minDistance - distance) / distance) * 0.5;
              const fx = dx * force;
              const fy = dy * force;
              currentNodes[i].vx -= fx;
              currentNodes[i].vy -= fy;
              currentNodes[j].vx += fx;
              currentNodes[j].vy += fy;
            }
          }
        }

        const currentEdges = edgesRef.current;
        for (const edge of currentEdges) {
          const source = currentNodes.find((n) => n.id === edge.source);
          const target = currentNodes.find((n) => n.id === edge.target);
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const idealDistance = 150;
            const force = ((distance - idealDistance) / distance) * 0.05;
            const fx = dx * force;
            const fy = dy * force;
            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        }

        for (const node of currentNodes) {
          if (node.id === draggedNode || node.fixed) continue;

          const dx = centerX - node.x;
          const dy = centerY - node.y;
          node.vx += dx * 0.001;
          node.vy += dy * 0.001;

          node.vx *= 0.9;
          node.vy *= 0.9;
          node.x += node.vx;
          node.y += node.vy;

          node.x = Math.max(node.radius, Math.min(width - node.radius, node.x));
          node.y = Math.max(node.radius, Math.min(height - node.radius, node.y));

          totalMovement += Math.abs(node.vx) + Math.abs(node.vy);
        }

        if (totalMovement < 0.5) {
          stableFrames++;
          if (stableFrames > 30) {
            setIsSimulating(false);
            clearInterval(interval);
          }
        } else {
          stableFrames = 0;
        }

        return currentNodes;
      });
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [edges.length, draggedNode, getContainerSize]);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (node && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      dragOffsetRef.current = {
        x: e.clientX - rect.left - node.x,
        y: e.clientY - rect.top - node.y,
      };
    }
    setDraggedNode(nodeId);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedNode || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffsetRef.current.x;
      const y = e.clientY - rect.top - dragOffsetRef.current.y;

      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id !== draggedNode) return node;
          const { width, height } = getContainerSize();
          return {
            ...node,
            x: Math.max(node.radius, Math.min(width - node.radius, x)),
            y: Math.max(node.radius, Math.min(height - node.radius, y)),
            vx: 0,
            vy: 0,
          };
        })
      );
    },
    [draggedNode, getContainerSize]
  );

  const handleNodeMouseUp = useCallback(() => {
    setDraggedNode(null);
  }, []);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (draggedNode) return;

      if (selectedNode === nodeId) {
        setSelectedNode(null);
      } else {
        setSelectedNode(nodeId);
        onCharacterSelect(nodeId);
      }
    },
    [selectedNode, onCharacterSelect, draggedNode]
  );

  const handleAddRelationship = useCallback(() => {
    if (!selectedNode || !newRelationTarget || !newRelationType) return;
    onRelationshipAdd(selectedNode, newRelationTarget, {
      targetCharacterId: newRelationTarget,
      type: newRelationType,
    });
    setShowAddRelation(false);
    setNewRelationTarget('');
    setNewRelationType('');
  }, [selectedNode, newRelationTarget, newRelationType, onRelationshipAdd]);

  const selectedCharacter = useMemo(() => {
    return characters.find((c) => c.id === selectedNode);
  }, [characters, selectedNode]);

  const connectedCharacters = useMemo(() => {
    if (!selectedNode) return [];
    const connectedIds = new Set<string>();
    for (const edge of edges) {
      if (edge.source === selectedNode) connectedIds.add(edge.target);
      if (edge.target === selectedNode) connectedIds.add(edge.source);
    }
    return characters.filter((c) => connectedIds.has(c.id));
  }, [selectedNode, edges, characters]);

  const getEdgeControlPoint = (source: GraphNode, target: GraphNode, index: number) => {
    const mx = (source.x + target.x) / 2;
    const my = (source.y + target.y) / 2;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const offset = (index % 2 === 0 ? 1 : -1) * 20 * Math.floor(index / 2 + 1);
    return {
      x: mx + (-dy / len) * offset,
      y: my + (dx / len) * offset,
    };
  };

  const arcCharacter = useMemo(() => {
    if (!selectedArcCharacter) return null;
    return characters.find((c) => c.id === selectedArcCharacter);
  }, [characters, selectedArcCharacter]);

  const sortedArcNodes = useMemo(() => {
    if (!arcCharacter?.characterArc?.nodes) return [];
    return [...arcCharacter.characterArc.nodes].sort((a, b) => a.order - b.order);
  }, [arcCharacter]);

  const handleOpenAddArcNode = useCallback(() => {
    setEditingArcNode(null);
    setArcNodeForm({
      title: '',
      description: '',
      arcType: 'turning_point',
      chapterId: '',
    });
    setShowArcNodeModal(true);
  }, []);

  const handleOpenEditArcNode = useCallback((node: CharacterArcNode) => {
    setEditingArcNode(node);
    setArcNodeForm({
      title: node.title,
      description: node.description,
      arcType: node.arcType,
      chapterId: node.chapterId || '',
    });
    setShowArcNodeModal(true);
  }, []);

  const handleSaveArcNode = useCallback(() => {
    if (!arcCharacter || !arcNodeForm.title.trim()) return;

    const currentNodes = arcCharacter.characterArc?.nodes || [];

    if (editingArcNode) {
      const updatedNodes = currentNodes.map((n) =>
        n.id === editingArcNode.id
          ? { ...n, ...arcNodeForm, chapterId: arcNodeForm.chapterId || undefined }
          : n
      );
      onCharacterArcUpdate(arcCharacter.id, { nodes: updatedNodes });
    } else {
      const newNode: CharacterArcNode = {
        id: `arc_${Date.now()}`,
        title: arcNodeForm.title,
        description: arcNodeForm.description,
        arcType: arcNodeForm.arcType,
        chapterId: arcNodeForm.chapterId || undefined,
        order: currentNodes.length,
        createdAt: new Date().toISOString(),
      };
      onCharacterArcUpdate(arcCharacter.id, { nodes: [...currentNodes, newNode] });
    }

    setShowArcNodeModal(false);
    setEditingArcNode(null);
  }, [arcCharacter, arcNodeForm, editingArcNode, onCharacterArcUpdate]);

  const handleDeleteArcNode = useCallback(
    (nodeId: string) => {
      if (!arcCharacter) return;
      const currentNodes = arcCharacter.characterArc?.nodes || [];
      const updatedNodes = currentNodes
        .filter((n) => n.id !== nodeId)
        .map((n, idx) => ({ ...n, order: idx }));
      onCharacterArcUpdate(arcCharacter.id, { nodes: updatedNodes });
    },
    [arcCharacter, onCharacterArcUpdate]
  );

  const handleMoveArcNode = useCallback(
    (nodeId: string, direction: 'up' | 'down') => {
      if (!arcCharacter) return;
      const currentNodes = [...(arcCharacter.characterArc?.nodes || [])].sort((a, b) => a.order - b.order);
      const index = currentNodes.findIndex((n) => n.id === nodeId);
      if (index === -1) return;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentNodes.length) return;

      const temp = currentNodes[index].order;
      currentNodes[index].order = currentNodes[targetIndex].order;
      currentNodes[targetIndex].order = temp;

      onCharacterArcUpdate(arcCharacter.id, { nodes: currentNodes });
    },
    [arcCharacter, onCharacterArcUpdate]
  );

  const renderArcView = () => {
    const mainCharacters = characters.filter((c) => c.role !== 'extra');

    if (!selectedArcCharacter) {
      return (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-ink mb-2">角色弧线</h3>
              <p className="text-sm text-ink-muted">选择一个角色来查看和编辑其成长弧线</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {mainCharacters.map((char) => {
                const arcNodes = char.characterArc?.nodes || [];
                return (
                  <div
                    key={char.id}
                    className="p-4 rounded-lg border border-border-subtle hover:border-brand/50 cursor-pointer transition-all"
                    onClick={() => setSelectedArcCharacter(char.id)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: ROLE_COLORS[char.role] }}
                      >
                        {char.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-ink">{char.name}</h4>
                        <span className="text-xs text-ink-faint">{CHARACTER_ROLE_LABELS[char.role]}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-ink-faint">
                      <span>{arcNodes.length} 个弧线节点</span>
                      {arcNodes.length > 0 && (
                        <div className="flex gap-1">
                          {arcNodes.slice(0, 5).map((node) => (
                            <span
                              key={node.id}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: ARC_NODE_COLORS[node.arcType] }}
                            />
                          ))}
                          {arcNodes.length > 5 && <span>+{arcNodes.length - 5}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                className="text-ink-muted hover:text-ink transition-colors"
                onClick={() => setSelectedArcCharacter(null)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: arcCharacter ? ROLE_COLORS[arcCharacter.role] : ROLE_COLORS.extra }}
              >
                {arcCharacter?.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">{arcCharacter?.name}</h3>
                <p className="text-xs text-ink-faint">角色弧线编辑</p>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAddArcNode}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>添加节点</span>
            </button>
          </div>

          {sortedArcNodes.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border-subtle rounded-lg">
              <svg
                className="w-12 h-12 text-ink-faint mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
                />
              </svg>
              <p className="text-ink-muted mb-2">暂无弧线节点</p>
              <p className="text-xs text-ink-faint mb-4">添加节点来描绘角色的成长轨迹</p>
              <button className="btn btn-primary btn-sm" onClick={handleOpenAddArcNode}>
                添加第一个节点
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border-subtle" />

              <div className="space-y-4">
                {sortedArcNodes.map((node, index) => {
                  const linkedChapter = chapters.find((ch) => ch.id === node.chapterId);
                  return (
                    <div key={node.id} className="relative pl-14">
                      <div
                        className="absolute left-4 top-4 w-5 h-5 rounded-full border-2 border-bg-base flex items-center justify-center"
                        style={{ backgroundColor: ARC_NODE_COLORS[node.arcType] }}
                      >
                        <span className="text-[10px] text-white font-medium">{index + 1}</span>
                      </div>

                      <div className="p-4 rounded-lg border border-border-subtle hover:border-border transition-all bg-bg-base">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] text-white"
                              style={{ backgroundColor: ARC_NODE_COLORS[node.arcType] }}
                            >
                              {ARC_NODE_TYPES[node.arcType]}
                            </span>
                            <h4 className="text-sm font-medium text-ink">{node.title}</h4>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              className="p-1 text-ink-faint hover:text-ink rounded"
                              onClick={() => handleMoveArcNode(node.id, 'up')}
                              disabled={index === 0}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                              </svg>
                            </button>
                            <button
                              className="p-1 text-ink-faint hover:text-ink rounded"
                              onClick={() => handleMoveArcNode(node.id, 'down')}
                              disabled={index === sortedArcNodes.length - 1}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            </button>
                            <button
                              className="p-1 text-ink-faint hover:text-brand rounded"
                              onClick={() => handleOpenEditArcNode(node)}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            <button
                              className="p-1 text-ink-faint hover:text-danger rounded"
                              onClick={() => handleDeleteArcNode(node.id)}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {node.description && (
                          <p className="text-xs text-ink-muted mb-2">{node.description}</p>
                        )}

                        {linkedChapter && (
                          <div className="flex items-center gap-1 text-xs text-ink-faint">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                            <span>关联章节: {linkedChapter.title}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 p-4 rounded-lg bg-bg-subtle border border-border-subtle">
            <h4 className="text-sm font-medium text-ink mb-3">弧线类型说明</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ARC_NODE_TYPES).map(([type, label]) => (
                <div key={type} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ARC_NODE_COLORS[type as ArcNodeType] }}
                  />
                  <span className="text-xs text-ink-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (characters.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-bg-subtle rounded-lg p-1">
              <button
                className={`px-3 py-1.5 rounded text-xs transition-all ${
                  !showArcView ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
                }`}
                onClick={() => setShowArcView(false)}
              >
                关系图谱
              </button>
              <button
                className={`px-3 py-1.5 rounded text-xs transition-all ${
                  showArcView ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
                }`}
                onClick={() => setShowArcView(true)}
              >
                角色弧线
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-ink-faint mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
            <p className="text-ink-muted mb-2">暂无角色</p>
            <p className="text-xs text-ink-faint">请先在左侧添加角色以查看关系图谱</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-bg-subtle rounded-lg p-1">
            <button
              className={`px-3 py-1.5 rounded text-xs transition-all ${
                !showArcView ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
              }`}
              onClick={() => {
                setShowArcView(false);
                setSelectedArcCharacter(null);
              }}
            >
              关系图谱
            </button>
            <button
              className={`px-3 py-1.5 rounded text-xs transition-all ${
                showArcView ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
              }`}
              onClick={() => setShowArcView(true)}
            >
              角色弧线
            </button>
          </div>
          {!showArcView && isSimulating && (
            <span className="text-xs text-ink-faint flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              布局计算中...
            </span>
          )}
        </div>

        {!showArcView && (
          <div className="flex items-center gap-2 text-xs text-ink-faint">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ROLE_COLORS.protagonist }} />
              主角
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ROLE_COLORS.supporting }} />
              配角
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ROLE_COLORS.antagonist }} />
              反派
            </span>
          </div>
        )}
      </div>

      {showArcView ? (
        renderArcView()
      ) : (
        <div className="flex-1 flex">
          <div
            ref={canvasRef}
            className="flex-1 relative overflow-hidden bg-bg-subtle/30"
            onMouseMove={handleMouseMove}
            onMouseUp={handleNodeMouseUp}
            onMouseLeave={handleNodeMouseUp}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
                <marker id="arrowhead-highlighted" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                </marker>
              </defs>

              {edges.map((edge, edgeIndex) => {
                const source = nodes.find((n) => n.id === edge.source);
                const target = nodes.find((n) => n.id === edge.target);
                if (!source || !target) return null;

                const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;

                const hasReverseEdge = edges.some(
                  (e) => e.source === edge.target && e.target === edge.source
                );

                let pathD: string;
                let labelX: number;
                let labelY: number;

                if (hasReverseEdge) {
                  const controlPoint = getEdgeControlPoint(source, target, edgeIndex);
                  const adjustedTarget = {
                    x: target.x + (target.x - controlPoint.x) * 0.1,
                    y: target.y + (target.y - controlPoint.y) * 0.1,
                  };
                  pathD = `M ${source.x} ${source.y} Q ${controlPoint.x} ${controlPoint.y} ${adjustedTarget.x} ${adjustedTarget.y}`;
                  labelX = controlPoint.x;
                  labelY = controlPoint.y;
                } else {
                  const offset = target.radius;
                  const dx = target.x - source.x;
                  const dy = target.y - source.y;
                  const len = Math.sqrt(dx * dx + dy * dy) || 1;
                  const endX = target.x - (dx / len) * offset;
                  const endY = target.y - (dy / len) * offset;
                  pathD = `M ${source.x} ${source.y} L ${endX} ${endY}`;
                  labelX = (source.x + endX) / 2;
                  labelY = (source.y + endY) / 2 - 5;
                }

                return (
                  <g key={`${edge.source}-${edge.target}`}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isHighlighted ? '#3b82f6' : '#94a3b8'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray={isHighlighted ? '' : '4 2'}
                      opacity={isHighlighted ? 1 : 0.5}
                      markerEnd={isHighlighted ? 'url(#arrowhead-highlighted)' : 'url(#arrowhead)'}
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      fontSize="10"
                      fill={isHighlighted ? '#3b82f6' : '#64748b'}
                      className="select-none"
                    >
                      {edge.type}
                    </text>
                  </g>
                );
              })}
            </svg>

            {nodes.map((node) => (
              <div
                key={node.id}
                className="absolute cursor-pointer transition-shadow select-none"
                style={{
                  left: node.x - node.radius,
                  top: node.y - node.radius,
                  width: node.radius * 2,
                  height: node.radius * 2,
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node.id)}
              >
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center text-white font-medium transition-all ${
                    selectedNode === node.id ? 'ring-4 ring-brand/30' : ''
                  } ${hoveredNode === node.id ? 'scale-110' : ''} ${
                    draggedNode === node.id ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{
                    backgroundColor: node.color,
                    fontSize: node.radius * 0.6,
                  }}
                >
                  {node.name.charAt(0)}
                </div>
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-[10px] text-ink-faint">{node.name}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedCharacter && (
            <div className="w-72 border-l border-border-subtle p-4 overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium"
                  style={{ backgroundColor: ROLE_COLORS[selectedCharacter.role] }}
                >
                  {selectedCharacter.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{selectedCharacter.name}</h3>
                  <p className="text-xs text-ink-faint">{CHARACTER_ROLE_LABELS[selectedCharacter.role]}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {selectedCharacter.personality && (
                  <div>
                    <span className="text-xs font-medium text-ink">性格</span>
                    <p className="text-xs text-ink-muted mt-0.5">{selectedCharacter.personality}</p>
                  </div>
                )}
                {selectedCharacter.goals && (
                  <div>
                    <span className="text-xs font-medium text-ink">目标</span>
                    <p className="text-xs text-ink-muted mt-0.5">{selectedCharacter.goals}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-border-subtle pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-ink">关联角色 ({connectedCharacters.length})</span>
                  <button className="text-xs text-brand hover:underline" onClick={() => setShowAddRelation(true)}>
                    + 添加关系
                  </button>
                </div>
                <div className="space-y-2">
                  {connectedCharacters.map((char) => {
                    const rel = selectedCharacter.relationships.find((r) => r.targetCharacterId === char.id);
                    return (
                      <div key={char.id} className="flex items-center justify-between p-2 rounded bg-bg-subtle">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px]"
                            style={{ backgroundColor: ROLE_COLORS[char.role] }}
                          >
                            {char.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs text-ink">{char.name}</span>
                            {rel && <span className="text-[10px] text-ink-faint ml-1">({rel.type})</span>}
                          </div>
                        </div>
                        <button
                          className="text-ink-faint hover:text-danger"
                          onClick={() => onRelationshipDelete(selectedCharacter.id, char.id)}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showAddRelation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-base rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-base font-semibold text-ink mb-4">添加角色关系</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-ink-muted block mb-1">目标角色</label>
                <select
                  className="input text-sm w-full"
                  value={newRelationTarget}
                  onChange={(e) => setNewRelationTarget(e.target.value)}
                >
                  <option value="">选择角色...</option>
                  {characters
                    .filter((c) => c.id !== selectedNode)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({CHARACTER_ROLE_LABELS[c.role]})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">关系类型</label>
                <input
                  className="input text-sm w-full"
                  placeholder="如：朋友、敌人、师徒..."
                  value={newRelationType}
                  onChange={(e) => setNewRelationType(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowAddRelation(false);
                  setNewRelationTarget('');
                  setNewRelationType('');
                }}
              >
                取消
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleAddRelationship}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showArcNodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-base rounded-xl p-6 w-[480px] shadow-xl">
            <h3 className="text-base font-semibold text-ink mb-4">
              {editingArcNode ? '编辑弧线节点' : '添加弧线节点'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-ink-muted block mb-1">节点标题 *</label>
                <input
                  className="input text-sm w-full"
                  placeholder="如：觉醒、堕落、重逢..."
                  value={arcNodeForm.title}
                  onChange={(e) => setArcNodeForm({ ...arcNodeForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">弧线类型</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(ARC_NODE_TYPES).map(([type, label]) => (
                    <button
                      key={type}
                      className={`px-2 py-1.5 rounded text-xs transition-all ${
                        arcNodeForm.arcType === type
                          ? 'text-white'
                          : 'bg-bg-subtle text-ink-muted hover:bg-bg-base'
                      }`}
                      style={
                        arcNodeForm.arcType === type
                          ? { backgroundColor: ARC_NODE_COLORS[type as ArcNodeType] }
                          : {}
                      }
                      onClick={() => setArcNodeForm({ ...arcNodeForm, arcType: type as ArcNodeType })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">描述</label>
                <textarea
                  className="input text-sm w-full min-h-[80px]"
                  placeholder="描述这个节点发生了什么..."
                  value={arcNodeForm.description}
                  onChange={(e) => setArcNodeForm({ ...arcNodeForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">关联章节（可选）</label>
                <select
                  className="input text-sm w-full"
                  value={arcNodeForm.chapterId}
                  onChange={(e) => setArcNodeForm({ ...arcNodeForm, chapterId: e.target.value })}
                >
                  <option value="">不关联章节</option>
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowArcNodeModal(false);
                  setEditingArcNode(null);
                }}
              >
                取消
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveArcNode}>
                {editingArcNode ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterRelationshipGraph;
