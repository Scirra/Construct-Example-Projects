
///////////////////////////////////////////////////////
// This example is a variant of the drawMesh() code from the 'Custom layer drawing' example ,
// but it modifies it to use a pre-created mesh data object (IMeshData) and the drawMeshData()
// method instead. See the 'Custom layer drawing' example for more comments around how to set
// up the kind of mesh that is used here. Creating a mesh data object ahead of time is significantly
// more efficient for large meshes, as it allows the data to be held on the GPU and re-used every frame.

// A loaded texture of the piggy image to draw from the piggy.png project file.
let piggyTexture : ITexture;

// The IMeshData storing vertices and indices to be drawn.
let meshData : IMeshData;

// On startup, listen for the beforeprojectstart event, and also load the piggy texture.
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));

	await LoadPiggyTexture(runtime);
});

// Load the project file piggy.png as a texture ready for rendering.
async function LoadPiggyTexture(runtime: IRuntime)
{
	// First fetch the piggy.png file over the network, and read it as a Blob
	// (an object representing some binary data).
	const response = await fetch("piggy.png");
	const blob = await response.blob();

	// Create an ImageBitmap from the blob, which decodes the image.
	const imageBitmap = await createImageBitmap(blob);

	// Create the texture from the ImageBitmap.
	piggyTexture = await runtime.renderer.createStaticTexture(imageBitmap);
}

// Before the project starts, get layer 0 and attach an afterdraw event.
async function OnBeforeProjectStart(runtime: IRuntime)
{
	const layer = runtime.layout.getLayer(0)!;
	layer.addEventListener("afterdraw", e => OnAfterLayerDraw(runtime, e.renderer));
}

//////////////////////////////////////////////////////////////////
// MARK: InitMeshData
// Called once on the first frame to initialize the IMeshData storing vertices and indices.
function InitMeshData(runtime: IRuntime, renderer: IRenderer)
{
	// This example uses a hard-coded mesh size. Note that if the mesh size is changed,
	// the MeshVertex instances should be changed accordingly, including adjusting their
	// texX and texY instance variables.
	const MESH_WIDTH = 4;
	const MESH_HEIGHT = 4;

	// The mesh will require a vertex for every point in the mesh, and also six indices
	// to specify two triangles for every point in the mesh except for the last column/row.
	const vertexCount = MESH_WIDTH * MESH_HEIGHT;
	const indexCount = (MESH_WIDTH - 1) * (MESH_HEIGHT - 1) * 6;

	// Create a mesh data object with capacity for the vertices and indices.
	meshData = renderer.createMeshData(vertexCount, indexCount);

	// The mesh data needs to have position, texture co-ordinate, color and index data
	// filled in. First write the color data, as that is the easiest to do. Every vertex
	// has the same color (opaque white, i.e. no change to the texture color).
	// The fillColor() helper method allows easily filling the color data with the same
	// color. When any data buffer is changed, markDataChanged() must be called accordingly
	// to indicate that the data should be sent to the GPU.
	meshData.fillColor(1, 1, 1, 1);
	meshData.markDataChanged("colors", 0, meshData.vertexCount);

	// Next, write the index data. See the 'Custom layer drawing' example for a more
	// detailed explanation of how this works.
	const indices = meshData.indices;
	let ii = 0;		// current index to write to in meshIndices

	// For each quad in the mesh (each point excluding the last column/row)
	for (let y = 0, leny = MESH_HEIGHT - 1; y < leny; ++y)
	{
		for (let x = 0, lenx = MESH_WIDTH - 1; x < lenx; ++x)
		{
			// Calculate the vertex index for the top left, top right,
			// bottom right and bottom left corners of the current quad.
			const tl = x + y * MESH_WIDTH;
			const tr = (x + 1) + y * MESH_WIDTH;
			const br = (x + 1) + (y + 1) * MESH_WIDTH;
			const bl = x + (y + 1) * MESH_WIDTH;

			// Write six indices to fill this quad, formed from two triangles:
			// the first being the top-left, top-right, and bottom-right points,
			// and the second being the top-left, bottom-right and bottom-left points.
			indices[ii++] = tl;
			indices[ii++] = tr;
			indices[ii++] = br;
			indices[ii++] = tl;
			indices[ii++] = br;
			indices[ii++] = bl;
		}
	}

	// Mark the index data as having changed so it is sent to the GPU.
	meshData.markIndexDataChanged();

	// Next, write the texture co-ordinates data. This is stored in the 'texX' and
	// 'texY' instance variables of the corresponding MeshVertex instances.
	const meshVertexInstances = runtime.objects.MeshVertex.getAllInstances();
	const texCoords = meshData.texCoords;

	for (let i = 0, len = meshVertexInstances.length; i < len; ++i)
	{
		const meshInst = meshVertexInstances[i];

		// The texture co-ordinates increment by 2 per instance as it writes x, y
		// components. These are read from instance variables.
		const ti = i * 2;
		texCoords[ti + 0] = meshInst.instVars.texX;
		texCoords[ti + 1] = meshInst.instVars.texY;
	}

	// Mark the texture co-ordinate data as having changed so it is sent to the GPU.
	meshData.markDataChanged("texCoords", 0, meshData.vertexCount);
}

///////////////////////////////////////////////////////////////////////////////
// MARK: Draw
// Handle the afterdraw event for layer 0. Note that as this is called after the
// rest of the layer has been drawn, anything drawn in this event will appear on
// top of the layer, as Construct uses a back-to-front renderer.
function OnAfterLayerDraw(runtime: IRuntime, renderer: IRenderer)
{
	// On the first frame only, create the mesh data object.
	// This fills in the color, index and texture co-ordinate data ahead of time,
	// as in this example it never changes.
	if (!meshData)
		InitMeshData(runtime, renderer);

	// Set basic texture rendering settings
	renderer.setTextureFillMode();
	renderer.setTexture(piggyTexture);
	renderer.resetColor();

	// The MeshVertex objects have the Drag & Drop behavior so they can be moved.
	// This means the position data may change every frame, so it is written and
	// sent to the GPU every frame.
	const meshVertexInstances = runtime.objects.MeshVertex.getAllInstances();
	const positions = meshData.positions;

	for (let i = 0, len = meshVertexInstances.length; i < len; ++i)
	{
		const meshInst = meshVertexInstances[i];

		// The vertex positions increment by 3 per instance as it writes x, y, z
		// components. The Z component is always 0 in this example.
		const vi = i * 3;
		positions[vi + 0] = meshInst.x;
		positions[vi + 1] = meshInst.y;
		positions[vi + 2] = 0;
	}

	// Mark the positions data as having changed so it is sent to the GPU.
	meshData.markDataChanged("positions", 0, meshData.vertexCount);

	// Call the drawMeshData() method to draw the prepared position, texture co-ordinate,
	// color and index data. In this example, all the data except position data is
	// prepared ahead of time and never changes - it is only updating position data
	// every frame. With large meshes, this is significantly more efficient than calling
	// drawMesh(), which processes all the provided data with every call.
	renderer.drawMeshData(meshData);
}
