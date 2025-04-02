
// Import any other script files here, e.g.:
// import * as myModule from "./mymodule.js";

///////////////////////////////////////////////
// Compute shader code

// Define data buffer size in bytes
const BUFFER_SIZE = 1000; 

// Compute shader code to run on the GPU.
// This just writes a 32-bit float with global_id.x multiplied by 1000
// and local_id.x added to it, so you can see what these values were for
// each run of the compute shader method.
const computeShaderCode = `
@group(0) @binding(0)
var<storage, read_write> output: array<f32>;

@compute @workgroup_size(64)
fn main(
	  @builtin(global_invocation_id)
	  global_id : vec3u,

	  @builtin(local_invocation_id)
	  local_id : vec3u
)
{
	// Avoid accessing the buffer out of bounds
	if (global_id.x >= ${BUFFER_SIZE}u)
	{
		return;
	}

	output[global_id.x] = f32(global_id.x) * 1000. + f32(local_id.x);
}
`;

///////////////////////////////////////////////
// WebGPU code to run the compute shader
async function GetWebGPUDevice()
{
	// Check WebGPU API is supported
	if (!navigator.gpu)
	{
		console.error("WebGPU API not supported");
		return null;
	}

	// Get a WebGPU adapter and then device. This only works if the
	// system hardware supports WebGPU.
	const adapter = await navigator.gpu.requestAdapter();
	if (!adapter)
	{
		console.error("No WebGPU adapter available");
		return null;
	}
	
	const device = await adapter.requestDevice();
	if (!device)
	{
		console.error("No WebGPU device available");
		return null;
	}
	
	console.log("Obtained WebGPU device: ", device);
	return device;
}

// Prepares an output buffer, bind group and compute pipeline for running the
// compute shader.
async function PrepareWebGPUComputeShader(device)
{
	// Create a shader module from the shader template literal
	const shaderModule = device.createShaderModule({
		code: computeShaderCode
	});
	
	// Create an output buffer for the compute shader to write its data to.
	const outputBuffer = device.createBuffer({
		size: BUFFER_SIZE,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
	});
	
	// Create a bind group layout and a bind group for the output buffer.
	const bindGroupLayout =	device.createBindGroupLayout({
		entries: [{
			binding: 0,
			visibility: GPUShaderStage.COMPUTE,
			buffer: {
				type: "storage"
			}
		}]
	});

	const bindGroup = device.createBindGroup({
		layout: bindGroupLayout,
		entries: [{
			binding: 0,
			resource: {
				buffer: outputBuffer,
			}
		}]
	});

	// Create a compute pipeline that runs the compute shader.
	const computePipeline = device.createComputePipeline({
		layout: device.createPipelineLayout({
			bindGroupLayouts: [bindGroupLayout]
		}),
		compute: {
			module: shaderModule,
			entryPoint: "main"
		}
	});
	
	// Return the output buffer, bind group and compute pipeline as these are all
	// needed to run the compute shader.
	return { outputBuffer, bindGroup, computePipeline };
}

// Run the compute shader and read its output back to CPU-accessible memory.
async function RunWebGPUComputeShader(device, outputBuffer, bindGroup, computePipeline)
{
	// The output buffer cannot be directly read. Instead a "staging" buffer is
	// created, which the output buffer is first copied to, and then the staging
	// buffer can be read back to CPU-accessible memory.
	const stagingBuffer = device.createBuffer({
		size: BUFFER_SIZE,
		usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
	});
	
	// Create GPUCommandEncoder to issue commands to the GPU,
	// and initiate a compute pass.
	const commandEncoder = device.createCommandEncoder();
	const passEncoder = commandEncoder.beginComputePass();
	passEncoder.setPipeline(computePipeline);
	passEncoder.setBindGroup(0, bindGroup);
	
	// Call dispatchWorkgroups() to execute the compute shader on the GPU.
	passEncoder.dispatchWorkgroups(Math.ceil(BUFFER_SIZE / 64));

	// End the render pass
	passEncoder.end();

	// Copy output buffer to staging buffer so it can be read back
	commandEncoder.copyBufferToBuffer(
		outputBuffer,	// source buffer
		0,				// source offset
		stagingBuffer,	// destination buffer
		0,				// destination offset
		BUFFER_SIZE		// size
	);

	// Submit the above work for the GPU to actually execute
	device.queue.submit([commandEncoder.finish()]);

	// Now the work has been submitted, map the staging buffer to read result back
	await stagingBuffer.mapAsync(
		GPUMapMode.READ,
		0,				// offset
		BUFFER_SIZE 	// size
	);

	// Once mapAsync has completed, the data can then be read with getMappedRange().
	// Copy the data to be returned before unmapping the staging buffer and
	// destroying it as it was only used for this run.
	const copyArrayBuffer = stagingBuffer.getMappedRange(0, BUFFER_SIZE);
	const arrayBuffer = copyArrayBuffer.slice();
	
	stagingBuffer.unmap();
	stagingBuffer.destroy();
	
	return arrayBuffer;
}

///////////////////////////////////////////////
// Construct startup code
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	// Try to obtain a WebGPU device.
	const device = await GetWebGPUDevice();
	
	// Display the WebGPU support in a Text object.
	const webgpuStatusTextInst = runtime.objects.WebGPUStatusText.getFirstInstance();
	webgpuStatusTextInst.text += (device ? "yes" : "no");
	
	// If WebGPU is supported, run the compute shader.
	if (device)
	{
		// First prepare the compute shader to be run, creating an output buffer,
		// bind group and compute pipeline.
		const { outputBuffer, bindGroup, computePipeline } = await PrepareWebGPUComputeShader(device);
		
		// Execute the compute shader using the previously prepared resources.
		const arrayBuffer = await RunWebGPUComputeShader(device, outputBuffer, bindGroup, computePipeline);
		
		// Log the result data to the console for inspection. Display the results as a
		// Float32Array as the binary data is an array of 32-bit floats.
		console.log("Result data from compute shader: ", new Float32Array(arrayBuffer));
	}
}
