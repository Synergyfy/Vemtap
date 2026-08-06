import { AutoAssignScope } from './dto/cluster.dto';

export const CLUSTER_AUTO_ASSIGN_QUEUE = 'cluster-auto-assign';

export const CLUSTER_AUTO_ASSIGN_JOB_ID = 'cluster-auto-assign-run';

export interface ClusterAutoAssignJobData {
  scope: AutoAssignScope;
}
