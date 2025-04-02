
// Top-level variables to hold the various instances used.
let spriteInst: InstanceType.Sprite;
let hueSliderInst: InstanceType.HueSlider;
let satSliderInst: InstanceType.SatSlider;
let lumSliderInst: InstanceType.LumSlider;

// Get to the beforeprojectstart event.
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime: IRuntime)
{
	// Get the Sprite instance and the three slider instances.
	spriteInst = runtime.objects.Sprite.getFirstInstance()!;
	hueSliderInst = runtime.objects.HueSlider.getFirstInstance()!;
	satSliderInst = runtime.objects.SatSlider.getFirstInstance()!;
	lumSliderInst = runtime.objects.LumSlider.getFirstInstance()!;
	
	// Add an "input" event to each of the sliders to update the effect parameters.
	// (Note "input" fires while dragging the slider, but "change" only fires when
	// the slider stops being dragged.)
	hueSliderInst.addEventListener("input", UpdateEffectParameters);
	satSliderInst.addEventListener("input", UpdateEffectParameters);
	lumSliderInst.addEventListener("input", UpdateEffectParameters);
}

function UpdateEffectParameters()
{
	// Get the Adjust HSL effect, which is the first entry in the Sprite
	// instance's effects array.
	const adjustHslEffect = spriteInst.effects[0];
	
	// Set the hue, saturation and luminance effect parameters by their index.
	// Also note the value is in the range 0-1, and the slider values range
	// from 0-100, so divide them by 100 to get the right range.
	adjustHslEffect.setParameter(0, hueSliderInst.value / 100);
	adjustHslEffect.setParameter(1, satSliderInst.value / 100);
	adjustHslEffect.setParameter(2, lumSliderInst.value / 100);
}