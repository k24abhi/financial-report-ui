import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import mockTreeData from '../data/tree_response.json';

// Token getter function - shared with api.ts
let getTokenFunction: (() => Promise<string>) | null = null;

export const setTreeTokenGetter = (fn: () => Promise<string>) => {
  getTokenFunction = fn;
};

// Generic API call function for tree operations
async function treeApiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token if available
  let token: string | null = null;
  if (getTokenFunction) {
    try {
      token = await getTokenFunction();
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw error;
    }
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Tree API call failed:', error);
    throw error;
  }
}

// TypeScript interfaces
export interface TreeNodeValue {
  id: number;
  text: string;
  period?: string;
  period_type?: string;
}

export interface TreeNode {
  id: number;
  label: string;
  values: TreeNodeValue[];
  merged_rows: any[];
  depth: number;
  order?: number;  // 0-based sibling position; absent in legacy records (treated as 0)
  children: TreeNode[];
  // Legacy fields for backward compatibility
  tree_id?: string;
  node_id?: string;
  hierarchy_level?: number;
  extracted_data_ids?: string[];
  metadata?: Record<string, any>;
}

export interface TreeStructureResponse {
  roots: TreeNode[];
  node_count: number;
  max_depth: number;
  // Legacy format support
  status?: string;
  data?: {
    company_id: string;
    client_id: string;
    tree: TreeNode[];
  };
}

export interface MergeNodesRequest {
  source_node_id: string;
  target_node_id: string;
  company_id: string;
  client_id: string;
}

export interface MergeNodesResponse extends TreeStructureResponse {
  merged_node_id: string;
}

export interface UnmergeNodeRequest {
  node_id: string;
  company_id: string;
  client_id: string;
  selected_ids?: string[];
}

export interface UnmergeNodeResponse {
  status: 'success' | 'partial_unmerge_required';
  message: string;
  constituent_nodes?: string[];
  separated_node_ids?: string[];
  merged_rows_info?: Record<string, string[]>;
}

export interface AddPeriodDataRequest {
  company_id: string;
  client_id: string;
  period: string;
  extracted_data: Array<{
    row: number;
    column: number;
    text: string;
    confidence?: number;
  }>;
}

export interface AddPeriodDataResponse {
  status: string;
  message: string;
  nodes_created: number;
  nodes_updated: number;
}

export interface CreateNodeRequest {
  company_id: string;
  client_id: string;
  label: string;
  parent_id?: string;
  hierarchy_level?: number;
  extracted_data_ids?: string[];
  metadata?: Record<string, any>;
}

export interface SaveTreeStateRequest {
  company_id: string;
  client_id: string;
  description?: string;
}

// Tree Data Service
export const treeDataService = {
  /**
   * Get the complete tree structure for a company
   */
  async getTreeStructure(
    companyId: string,
    clientId?: string // Optional for backward compatibility, not used
  ): Promise<TreeStructureResponse> {
    const queryParams = new URLSearchParams({
      company_id: companyId,
    });

    try {
      const response = await treeApiCall<TreeStructureResponse>(
        `${API_ENDPOINTS.getTreeData}?${queryParams}`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      // Only fall back to mock data during local development so production errors surface clearly
      const isDev = (import.meta as any).env?.DEV === true;
      if (isDev) {
        console.warn('Tree API failed – using mock data for development:', error);
        return mockTreeData as TreeStructureResponse;
      }
      throw error;
      return mockTreeData as TreeStructureResponse;
    }
  },

  /**
   * Merge nodes together
   * @param nodeIds - Array of node IDs to merge
   */
  async mergeNodes(
    clientId: string, // Deprecated, kept for backward compatibility
    companyId: string,
    nodeIds: string[]
  ): Promise<MergeNodesResponse> {    console.log('🔄 Merging nodes:', nodeIds);
    
    const response = await treeApiCall<MergeNodesResponse>(
      API_ENDPOINTS.mergeUnmergeNodes,
      {
        method: 'POST',
        body: JSON.stringify({
          company_id: companyId,
          action: 'merge',
          node_ids: nodeIds,
        }),
      }
    );

    console.log('✅ Merge successful:', response);
    return response;
  },

  /**
   * Unmerge nodes
   * @param nodeIds - Array of node IDs to unmerge
   */
  async unmergeNode(
    clientId: string, // Deprecated, kept for backward compatibility
    companyId: string,
    nodeIds: string[]
  ): Promise<UnmergeNodeResponse> {
    console.log('🔄 Unmerging nodes:', nodeIds);
    
    const response = await treeApiCall<UnmergeNodeResponse>(
      API_ENDPOINTS.mergeUnmergeNodes,
      {
        method: 'POST',
        body: JSON.stringify({
          company_id: companyId,
          action: 'unmerge',
          node_ids: nodeIds,
        }),
      }
    );

    console.log('✅ Unmerge response:', response);
    return response;
  },

  /**
   * Delete nodes from the tree
   */
  async deleteNodes(
    clientId: string, // Deprecated, kept for backward compatibility
    companyId: string,
    nodeIds: string[]
  ): Promise<{ status: string; message: string }> {
    return treeApiCall(
      API_ENDPOINTS.deleteTreeNodes,
      { 
        method: 'DELETE',
        body: JSON.stringify({
          company_id: companyId,
          node_ids: nodeIds,
        }),
      }
    );
  },

  /**
   * Reorganize a node by moving it in the tree
   * @param companyId - Company ID
   * @param nodeId - ID of the node to move
   * @param newParentId - ID of the new parent (for 'child' position), or null for root
   * @param position - 'child' | 'before' | 'after'
   * @param referenceNodeId - Required for 'before'/'after': position relative to this node
   */
  async reorganizeNode(
    companyId: string,
    nodeId: string,
    newParentId: string | null,
    position: 'child' | 'before' | 'after' = 'child',
    referenceNodeId?: string,
  ): Promise<TreeStructureResponse> {
    const response = await treeApiCall<TreeStructureResponse>(
      API_ENDPOINTS.reorganizeNode,
      {
        method: 'POST',
        body: JSON.stringify({
          company_id: companyId,
          node_id: nodeId,
          new_parent_id: newParentId,
          position,
          reference_node_id: referenceNodeId ?? null,
        }),
      }
    );

    return response;
  },

  /**
   * Get all available periods for a company
   */
  async getAllPeriods(
    clientId: string, // Deprecated, kept for backward compatibility
    companyId: string
  ): Promise<{ periods: string[] }> {
    const queryParams = new URLSearchParams({
      company_id: companyId,
    });

    return treeApiCall(
      `${API_ENDPOINTS.getAllPeriods}?${queryParams}`,
      { method: 'GET' }
    );
  },
};

/**
 * Collect the IDs of all nodes that have been merged into another node.
 * Merged constituent nodes are stored in `merged_rows` of the resulting node.
 * They should remain in the DB but must not appear as standalone rows in the UI.
 */
export function getConstituentNodeIds(nodes: TreeNode[]): Set<string> {
  const constituentIds = new Set<string>();

  function traverse(nodes: TreeNode[]): void {
    for (const node of nodes) {
      if (node.merged_rows && node.merged_rows.length > 0) {
        for (const row of node.merged_rows) {
          if (row !== null && row !== undefined) {
            if (typeof row === 'number') {
              constituentIds.add(String(row));
            } else if (typeof row === 'string') {
              constituentIds.add(row);
            } else if (typeof row === 'object') {
              if (row.id !== undefined && row.id !== null) {
                constituentIds.add(String(row.id));
              } else if (row.node_id !== undefined && row.node_id !== null) {
                constituentIds.add(String(row.node_id));
              }
            }
          }
        }
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return constituentIds;
}

// Helper function to flatten tree for display
// Pass `constituentIds` (from getConstituentNodeIds) to hide merged-source nodes.
export function flattenTree(
  nodes: TreeNode[],
  level: number = 0,
  constituentIds: Set<string> = new Set()
): Array<TreeNode & { level: number }> {
  const result: Array<TreeNode & { level: number }> = [];
  
  for (const node of nodes) {
    // Skip nodes that have already been merged into another node
    if (constituentIds.has(String(node.id)) || (node.node_id && constituentIds.has(node.node_id))) {
      continue;
    }
    result.push({ ...node, level });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, level + 1, constituentIds));
    }
  }
  
  return result;
}

// Helper function to find a node by ID in the tree
export function findNodeInTree(nodes: TreeNode[], nodeId: string | number): TreeNode | null {
  for (const node of nodes) {
    if (String(node.id) === String(nodeId) || node.node_id === String(nodeId)) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findNodeInTree(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}

// Helper function to check if a node is merged
export function isMergedNode(node: TreeNode): boolean {
  return node.merged_rows && node.merged_rows.length > 0;
}

// Helper function to get merge count for display
export function getMergeCount(node: TreeNode): string {
  if (!isMergedNode(node)) return '';
  const count = node.merged_rows.length;
  return count > 2 ? '3+' : count.toString();
}
