import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { Character, Relationship } from '../../types/novel';
import { CHARACTER_ROLE_LABELS } from '../../types/novel';

interface CharacterRelationshipGraphProps {
  characters: Character[];
  onCharacterSelect: (characterId: string) => void;
  onRelationshipAdd: (fromId: string, toId: string, relationship: Relationship) => void;
  onRelationshipDelete: (characterId: string, targetId: string) => void;
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
  onCharacterSelect,
  onRelationshipAdd,
  onRelationshipDelete,
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

  const characterAppearances = useMemo(() => {
    const map = new Map<string, number>();
    for (const char of characters) {
      map.set(char.id, char.relationships.length);
    }
    return map;
  }, [characters]);

  useEffect(() => {
    const canvasWidth = canvasRef.current?.clientWidth || 800;
    const canvasHeight = canvasRef.current?.clientHeight || 600;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const protagonist = characters.find((c) => c.role === 'protagonist');
    const newNodes: GraphNode[] = characters.map((char, index) => {
      const angle = (2 * Math.PI * index) / characters.length;
      const radius = char.role === 'protagonist' ? 0 : 150 + Math.random() * 50;
      const x = char.role === 'protagonist' ? centerX : centerX + radius * Math.cos(angle);
      const y = char.role === 'protagonist' ? centerY : centerY + radius * Math.sin(angle);

      return {
        id: char.id,
        name: char.name,
        role: char.role,
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 20 + (characterAppearances.get(char.id) || 0) * 2,
        color: ROLE_COLORS[char.role] || ROLE_COLORS.extra,
      };
    });

    const newEdges: GraphEdge[] = [];
    for (const char of characters) {
      for (const rel of char.relationships) {
        if (characters.some((c) => c.id === rel.targetCharacterId)) {
          const exists = newEdges.some(
            (e) =>
              (e.source === char.id && e.target === rel.targetCharacterId) ||
              (e.source === rel.targetCharacterId && e.target === char.id)
          );
          if (!exists) {
            newEdges.push({
              source: char.id,
              target: rel.targetCharacterId,
              type: rel.type,
              description: rel.description,
            });
          }
        }
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [characters, characterAppearances]);

  useEffect(() => {
    if (nodes.length === 0) return;

    const interval = setInterval(() => {
      setNodes((prevNodes) => {
        const newNodes = prevNodes.map((node) => ({ ...node }));
        const centerX = canvasRef.current?.clientWidth || 800;
        const centerY = canvasRef.current?.clientHeight || 600;

        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[j].x - newNodes[i].x;
            const dy = newNodes[j].y - newNodes[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDistance = newNodes[i].radius + newNodes[j].radius + 30;

            if (distance < minDistance) {
              const force = (minDistance - distance) / distance * 0.5;
              const fx = dx * force;
              const fy = dy * force;
              newNodes[i].vx -= fx;
              newNodes[i].vy -= fy;
              newNodes[j].vx += fx;
              newNodes[j].vy += fy;
            }
          }
        }

        for (const edge of edges) {
          const source = newNodes.find((n) => n.id === edge.source);
          const target = newNodes.find((n) => n.id === edge.target);
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const idealDistance = 150;
            const force = (distance - idealDistance) / distance * 0.05;
            const fx = dx * force;
            const fy = dy * force;
            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        }

        for (const node of newNodes) {
          if (node.id === draggedNode) continue;

          const dx = centerX - node.x;
          const dy = centerY - node.y;
          node.vx += dx * 0.001;
          node.vy += dy * 0.001;

          node.vx *= 0.9;
          node.vy *= 0.9;
          node.x += node.vx;
          node.y += node.vy;

          node.x = Math.max(node.radius, Math.min(centerX * 2 - node.radius, node.x));
          node.y = Math.max(node.radius, Math.min(centerY * 2 - node.radius, node.y));
        }

        return newNodes;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [edges, draggedNode]);

  const handleNodeMouseDown = useCallback((nodeId: string) => {
    setDraggedNode(nodeId);
  }, []);

  const handleNodeMouseUp = useCallback(() => {
    setDraggedNode(null);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    } else {
      setSelectedNode(nodeId);
      onCharacterSelect(nodeId);
    }
  }, [selectedNode, onCharacterSelect]);

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

  const renderArcView = () => {
    const protagonist = characters.find((c) => c.role === 'protagonist');
    if (!protagonist) return <div className="text-center text-ink-muted">请设置主角以查看角色弧线</div>;

    return (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-brand/5 border border-brand/20">
          <h4 className="text-sm font-medium text-ink mb-2">主角弧线: {protagonist.name}</h4>
          <p className="text-xs text-ink-muted">{protagonist.background || '暂无背景故事'}</p>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-ink">角色成长轨迹</h4>
          {characters
            .filter((c) => c.role !== 'extra')
            .map((char) => (
              <div key={char.id} className="flex items-start gap-4 p-3 rounded-lg bg-bg-subtle">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: ROLE_COLORS[char.role] }}
                >
                  {char.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-ink">{char.name}</span>
                    <span className="text-xs text-ink-faint">{CHARACTER_ROLE_LABELS[char.role]}</span>
                  </div>
                  <p className="text-xs text-ink-muted">{char.goals || '暂无目标设定'}</p>
                  <div className="mt-2 h-2 bg-bg-base rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, char.relationships.length * 20)}%`,
                        backgroundColor: ROLE_COLORS[char.role],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

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
      </div>

      {showArcView ? (
        <div className="flex-1 p-6 overflow-y-auto">{renderArcView()}</div>
      ) : (
        <div className="flex-1 flex">
          <div ref={canvasRef} className="flex-1 relative overflow-hidden bg-bg-subtle/30">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {edges.map((edge) => {
                const source = nodes.find((n) => n.id === edge.source);
                const target = nodes.find((n) => n.id === edge.target);
                if (!source || !target) return null;

                const isHighlighted =
                  hoveredNode === edge.source || hoveredNode === edge.target;

                return (
                  <g key={`${edge.source}-${edge.target}`}>
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isHighlighted ? '#3b82f6' : '#94a3b8'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray={isHighlighted ? '' : '4 2'}
                      opacity={isHighlighted ? 1 : 0.5}
                    />
                    <text
                      x={(source.x + target.x) / 2}
                      y={(source.y + target.y) / 2 - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fill={isHighlighted ? '#3b82f6' : '#64748b'}
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
                className="absolute cursor-pointer transition-shadow"
                style={{
                  left: node.x - node.radius,
                  top: node.y - node.radius,
                  width: node.radius * 2,
                  height: node.radius * 2,
                }}
                onMouseDown={() => handleNodeMouseDown(node.id)}
                onMouseUp={handleNodeMouseUp}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node.id)}
              >
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center text-white font-medium transition-all ${
                    selectedNode === node.id ? 'ring-4 ring-brand/30' : ''
                  } ${hoveredNode === node.id ? 'scale-110' : ''}`}
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
                  <button
                    className="text-xs text-brand hover:underline"
                    onClick={() => setShowAddRelation(true)}
                  >
                    + 添加关系
                  </button>
                </div>
                <div className="space-y-2">
                  {connectedCharacters.map((char) => {
                    const rel = selectedCharacter.relationships.find(
                      (r) => r.targetCharacterId === char.id
                    );
                    return (
                      <div
                        key={char.id}
                        className="flex items-center justify-between p-2 rounded bg-bg-subtle"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px]"
                            style={{ backgroundColor: ROLE_COLORS[char.role] }}
                          >
                            {char.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs text-ink">{char.name}</span>
                            {rel && (
                              <span className="text-[10px] text-ink-faint ml-1">({rel.type})</span>
                            )}
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
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddRelationship}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterRelationshipGraph;
