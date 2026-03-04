import { ComputeManagementClient } from "@azure/arm-compute";
import { DefaultAzureCredential } from "@azure/identity";

function getComputeClient() {
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
  if (!subscriptionId) {
    throw new Error("Azure VM not configured. Set AZURE_SUBSCRIPTION_ID.");
  }
  const credential = new DefaultAzureCredential();
  return new ComputeManagementClient(credential, subscriptionId);
}

function getVmConfig() {
  const resourceGroup = process.env.AZURE_RESOURCE_GROUP ?? "livestreamer-rg";
  const vmName = process.env.AZURE_VM_NAME ?? "livekit-vm";
  return { resourceGroup, vmName };
}

export async function startLiveKitVM(): Promise<void> {
  const client = getComputeClient();
  const { resourceGroup, vmName } = getVmConfig();
  await client.virtualMachines.beginStartAndWait(resourceGroup, vmName);
}

export async function stopLiveKitVM(): Promise<void> {
  const client = getComputeClient();
  const { resourceGroup, vmName } = getVmConfig();
  await client.virtualMachines.beginDeallocateAndWait(resourceGroup, vmName);
}

export async function getVMStatus(): Promise<string> {
  const client = getComputeClient();
  const { resourceGroup, vmName } = getVmConfig();
  const instanceView = await client.virtualMachines.instanceView(
    resourceGroup,
    vmName
  );
  const powerState = instanceView.statuses?.find((s) =>
    s.code?.startsWith("PowerState/")
  );
  return powerState?.displayStatus ?? "Unknown";
}
