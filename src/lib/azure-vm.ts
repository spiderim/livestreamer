import { ComputeManagementClient } from "@azure/arm-compute";
import { DefaultAzureCredential } from "@azure/identity";

const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID!;
const resourceGroup = process.env.AZURE_RESOURCE_GROUP!;
const vmName = process.env.AZURE_VM_NAME!;

function getComputeClient() {
  const credential = new DefaultAzureCredential();
  return new ComputeManagementClient(credential, subscriptionId);
}

export async function startLiveKitVM(): Promise<void> {
  const client = getComputeClient();
  await client.virtualMachines.beginStartAndWait(resourceGroup, vmName);
}

export async function stopLiveKitVM(): Promise<void> {
  const client = getComputeClient();
  await client.virtualMachines.beginDeallocateAndWait(resourceGroup, vmName);
}

export async function getVMStatus(): Promise<string> {
  const client = getComputeClient();
  const instanceView = await client.virtualMachines.instanceView(
    resourceGroup,
    vmName
  );
  const powerState = instanceView.statuses?.find((s) =>
    s.code?.startsWith("PowerState/")
  );
  return powerState?.displayStatus ?? "Unknown";
}
