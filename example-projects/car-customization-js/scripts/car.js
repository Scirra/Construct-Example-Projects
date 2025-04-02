// Car class
export default class Car {

    // Constructor
    constructor(runtime) {
    
        // Body
        this.body = runtime.objects.CarBody.getFirstInstance();
        
        // Decals / Effects
        this.neon = runtime.objects.CarNeon.getFirstInstance();
        
        // Small parts
        this.exhaustLeft = runtime.objects.CarExhaustLeft.getFirstInstance();
        this.exhaustRight = runtime.objects.CarExhaustRight.getFirstInstance();
        this.hoodScoop = runtime.objects.CarHoodScoop.getFirstInstance();
        this.spoiler = runtime.objects.CarSpoiler.getFirstInstance();
        this.wing = runtime.objects.CarWing.getFirstInstance();
        this.wingSupportList = runtime.objects.CarWingSupport.getAllInstances();
        
        // Body textures
        this.bodyTextures = [
            runtime.objects.TexBodyBack.getFirstInstance(),
            runtime.objects.TexBodyFront.getFirstInstance(),
            runtime.objects.TexBodyLeft.getFirstInstance(),
            runtime.objects.TexBodyRight.getFirstInstance(),
            runtime.objects.TexBodySmallBack.getFirstInstance(),
            runtime.objects.TexBodySmallLeft.getFirstInstance(),
            runtime.objects.TexBodySmallRight.getFirstInstance(),
            runtime.objects.TexBodySmallTop.getFirstInstance(),
            runtime.objects.TexRoof.getFirstInstance(),
            runtime.objects.TexSpoilerLeft.getFirstInstance(),
            runtime.objects.TexSpoilerRight.getFirstInstance(),
            runtime.objects.TexSpoilerInner.getFirstInstance(),
            runtime.objects.TexSpoilerOuter.getFirstInstance(),
            runtime.objects.TexWindowBack.getFirstInstance(),
            runtime.objects.TexWindowFront.getFirstInstance(),
            runtime.objects.TexWindowCornerSide.getFirstInstance(),
            runtime.objects.TexWindowCornerFront.getFirstInstance(),
            runtime.objects.TexWindowLeft.getFirstInstance(),
            runtime.objects.TexWindowRight.getFirstInstance(),    
        ];
        
        // Hood textures (has to be separate due to carbon fiber and scoop)
        this.hoodTextures = [
            runtime.objects.TexHoodTop.getFirstInstance(),
            runtime.objects.TexHoodLeft.getFirstInstance(),
            runtime.objects.TexHoodRight.getFirstInstance(),
            runtime.objects.TexHoodScoopTop.getFirstInstance(),
            runtime.objects.TexHoodScoopFront.getFirstInstance(),
            runtime.objects.TexHoodScoopLeft.getFirstInstance(),
            runtime.objects.TexHoodScoopRight.getFirstInstance(),
        ]
        
        // Rims textures
        this.rimTexture = runtime.objects.TexWheel.getFirstInstance();
        
        // Stripes textures
        this.stripesTextures = [
            runtime.objects.TexDecalStripeBack.getFirstInstance(),
            runtime.objects.TexDecalStripeHood.getFirstInstance(),
            runtime.objects.TexDecalStripeRoof.getFirstInstance(),
        ];
        
        // Decals textures
        this.decalsTextures = [
            runtime.objects.TexDecalLeft.getFirstInstance(),
            runtime.objects.TexDecalRight.getFirstInstance(),
        ];
        
        // Variables (equivalent to menus)
        this.color = 0;
        this.rims = 0;
        this.vspoiler = 0;
        this.vhood = 0;
        this.exhaust = 0;
        this.stripes = 0;
        this.decals = 0;
        this.vneon = 0;
        this.height = 2;
        
        // Amount of available options for each item
        this.MAXCOLOR = 9;
        this.MAXRIMS = 5;
        this.MAXSPOILER = 3;
        this.MAXHOOD = 4;
        this.MAXHOODINTERNAL = 10;
        this.MAXEXHAUST = 3;
        this.MAXSTRIPES = 5;
        this.MAXDECALS = 6;
        this.MAXNEON = 10;
        this.MAXHEIGHT = 5;
    }
    
    // Getters
    getX = () => this.body.x;
    getY = () => this.body.y;
    getZ = () => this.body.zElevation;
    getAngle = () => this.body.angle;
    
    // Setters
    setAngle = (angle) => this.body.angle = angle;
    
    // Customization functions
    
    changeColor(colorID) {
        // Change body color
        
        this.color = colorID;
    
        for (const obj of this.bodyTextures) {
            obj.animationFrame = colorID;
        }
        
        if (this.vhood < 2) {
            for (const hobj of this.hoodTextures) {
                hobj.animationFrame = colorID;
            }
        }
    }
    
    changeRims(rimsID) {
        // Change rims
        
        this.rims = rimsID;
        this.rimTexture.animationFrame = rimsID;
    }
    
    changeSpoiler(spoilerID) {
        // Change spoiler
    
        this.vspoiler = spoilerID;
        
        this.spoiler.isVisible = spoilerID == 1;
        this.wing.isVisible = spoilerID == 2;
        for (const ws of this.wingSupportList) {
            ws.isVisible = spoilerID == 2;
        }
    }
    
    changeHood(hoodID) {
        // Change hood
    
        this.vhood = hoodID;
        
        // Normal paint or carbon fiber?
        if (hoodID < 2) {
            for (const ht of this.hoodTextures) {
                ht.animationFrame = this.color;
            }
        } else {
            for (const ht of this.hoodTextures) {
                ht.animationFrame = this.MAXHOODINTERNAL - 1;
            }
        }
        
        // No scoop or scoop?
        this.hoodScoop.isVisible = hoodID == 1 || hoodID == 3
    }
    
    changeExhaust(exhaustID) {
        // Change exhaust
    
        this.exhaust = exhaustID;
        
        this.exhaustLeft.isVisible = exhaustID == 0 || exhaustID == 2;
        this.exhaustRight.isVisible = exhaustID == 1 || exhaustID == 2;
    }
    
    changeStripes(stripesID) {
        // Change stripes
        
        this.stripes = stripesID;
        
        for (const st of this.stripesTextures) {
            st.animationFrame = stripesID;
        }
    }
    
    changeDecals(decalsID) {
        // Change decals
        
        this.decals = decalsID;
        
        for (const dt of this.decalsTextures) {
            dt.animationFrame = decalsID;
        }
    }
    
    changeNeon(neonID) {
        // Change neon
        
        this.vneon = neonID;
        this.neon.animationFrame = neonID;
    }
    
    changeHeight(increment) {
        // Change ride height
    
        if (increment == -1 && this.height > 0) {
            this.height--;
            this.body.zElevation += increment;
        }
        if (increment == 1 && this.height < 5) {
            this.height++;
            this.body.zElevation += increment;
        }
        
        
    }
}