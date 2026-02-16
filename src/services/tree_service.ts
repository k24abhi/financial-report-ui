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
}

export interface TreeNode {
  id: number;
  label: string;
  values: TreeNodeValue[];
  merged_rows: any[];
  depth: number;
  children: TreeNode[];
  // Legacy fields for backward compatibility
  tree_id?: string;
  node_id?: string;
  hierarchy_level?: number;
  order?: number;
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

export interface MergeNodesResponse {
  status: string;
  message: string;
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
    clientId: string,
    includeExtractedData: boolean = false
  ): Promise<TreeStructureResponse> {
    const queryParams = new URLSearchParams({
      company_id: companyId,
      client_id: clientId,
      include_extracted_data: includeExtractedData.toString(),
    });

    try {
      const response = await treeApiCall<TreeStructureResponse>(
        `${API_ENDPOINTS.getTreeStructure}?${queryParams}`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      // Fallback to mock data if API fails (for development)
      console.log('Using mock tree data');
      return mockTreeData as TreeStructureResponse;
    }
  },

  /**
   * Create a new node in the tree
   */
  async createNode(request: CreateNodeRequest): Promise<{ status: string; node_id: string }> {
    return treeApiCall(
      API_ENDPOINTS.createNode,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  },

  /**
   * Update an existing node
   */
  async updateNode(
    nodeId: string,
    companyId: string,
    updates: Partial<{ label: string; metadata: Record<string, any> }>
  ): Promise<{ status: string; message: string }> {
    return treeApiCall(
      API_ENDPOINTS.updateNode,
      {
        method: 'PUT',
        body: JSON.stringify({
          node_id: nodeId,
          company_id: companyId,
          ...updates,
        }),
      }
    );
  },

  /**
   * Delete a node from the tree
   */
  async deleteNode(
    nodeId: string,
    companyId: string
  ): Promise<{ status: string; message: string }> {
    const queryParams = new URLSearchParams({
      node_id: nodeId,
      company_id: companyId,
    });

    return treeApiCall(
      `${API_ENDPOINTS.deleteNode}?${queryParams}`,
      { method: 'DELETE' }
    );
  },

  /**
   * Merge two nodes together
   * Source node + Target node → Merged node
   * The merged node will have merged_rows field containing both node IDs
   */
  async mergeNodes(request: MergeNodesRequest): Promise<MergeNodesResponse> {
    console.log('🔄 Merging nodes:', request);
    
    const response = await treeApiCall<MergeNodesResponse>(
      API_ENDPOINTS.mergeNodes,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    console.log('✅ Merge successful:', response);
    return response;
  },

  /**
   * Unmerge a node
   * Two-step process for partial unmerge:
   * 1. Call without selected_ids to get constituent_nodes options
   * 2. Call with selected_ids to perform the unmerge
   */
  async unmergeNode(request: UnmergeNodeRequest): Promise<UnmergeNodeResponse> {
    console.log('🔄 Unmerging node:', request);
    
    const response = await treeApiCall<UnmergeNodeResponse>(
      API_ENDPOINTS.unmergeNode,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    console.log('✅ Unmerge response:', response);
    return response;
  },

  /**
   * Add period data to the tree
   * Creates new nodes as children to matching parent nodes
   */
  async addPeriodData(request: AddPeriodDataRequest): Promise<AddPeriodDataResponse> {
    console.log('📅 Adding period data:', request.period);
    
    const response = await treeApiCall<AddPeriodDataResponse>(
      API_ENDPOINTS.addPeriodData,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    console.log('✅ Period data added:', response);
    return response;
  },

  /**
   * Save current tree state as a snapshot
   */
  async saveTreeState(request: SaveTreeStateRequest): Promise<{ status: string; state_id: string }> {
    return treeApiCall(
      API_ENDPOINTS.saveTreeState,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  },

  /**
   * Get tree state history
   */
  async getTreeStates(
    companyId: string,
    clientId: string
  ): Promise<{ status: string; states: any[] }> {
    const queryParams = new URLSearchParams({
      company_id: companyId,
      client_id: clientId,
    });

    return treeApiCall(
      `${API_ENDPOINTS.getTreeStates}?${queryParams}`,
      { method: 'GET' }
    );
  },

  /**
   * Extract and store PDF data, creating nodes automatically
   */
  async extractAndStore(
    file: File,
    companyId: string,
    clientId: string,
    period: string
  ): Promise<{ status: string; message: string; nodes_created: number }> {
    // Get token
    let token: string | null = null;
    if (getTokenFunction) {
      token = await getTokenFunction();
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_id', companyId);
    formData.append('client_id', clientId);
    formData.append('period', period);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.extractAndStore}`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || 'Failed to extract and store data');
    }

    return await response.json();
  },
};

// Helper function to flatten tree for display
export function flattenTree(nodes: TreeNode[], level: number = 0): Array<TreeNode & { level: number }> {
  const result: Array<TreeNode & { level: number }> = [];
  
  for (const node of nodes) {
    result.push({ ...node, level });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, level + 1));
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
