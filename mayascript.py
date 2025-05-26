import maya.cmds as cmds
import MASH.api as mapi

def create_mash(objects):
    """
    Create a MASH network with the first object as the base mesh and 
    the remaining objects as curves.
    """
    if not objects or len(objects) < 2:
        cmds.error("Please provide at least one base mesh and one curve")
        return None
    
    base_mesh = objects[0]
    curve_list = objects[1:]
    
    # Validate objects
    if not cmds.objExists(base_mesh):
        cmds.error(f"Base mesh '{base_mesh}' does not exist")
        return None
    
    for curve in curve_list:
        if not cmds.objExists(curve):
            cmds.error(f"Curve '{curve}' does not exist")
            return None
    
    try:
        # Select the mesh first
        cmds.select(base_mesh, r=True)
        
        # Create network
        mashNetwork = mapi.Network()
        network_name = mashNetwork.createNetwork(name="MASH1")
        print(f"Created network: {network_name}")
        
        # Set point count
        mashNetwork.setPointCount(74)
        
        # Configure distributor node
        distribute_node = mashNetwork.distribute
        
        # Set distribute attributes
        cmds.setAttr(f"{distribute_node}.gridAmplitudeX", 5)
        cmds.setAttr(f"{distribute_node}.gridAmplitudeY", 5)
        cmds.setAttr(f"{distribute_node}.gridAmplitudeZ", 5)
        cmds.setAttr(f"{distribute_node}.gridx", 3)
        cmds.setAttr(f"{distribute_node}.gridy", 1)
        cmds.setAttr(f"{distribute_node}.gridz", 3)
        
        # Add Influence node
        influence_node = mashNetwork.addNode("MASH_Influence")
        cmds.setAttr(f"{influence_node.name}.influenceRadius", 38.38383842)
        cmds.setAttr(f"{influence_node.name}.falloffPower", 4.954545454)
        
        # Debug: Print available attributes
        print("Available influence node attributes:")
        attributes = cmds.listAttr(influence_node.name)
        for attr in attributes:
            print(attr)
        
        # Create and position locator for Influence
        print("Creating influence locator...")
        influence_loc = cmds.spaceLocator(name=f"{influence_node.name}_loc")[0]
        print(f"Created locator: {influence_loc}")
        
        # Set transform values
        cmds.setAttr(f"{influence_loc}.translateX", -2.496010564)
        cmds.setAttr(f"{influence_loc}.translateY", 1.188131857)
        cmds.setAttr(f"{influence_loc}.translateZ", -2.012682281)
        cmds.setAttr(f"{influence_loc}.scaleX", 3.445648364)
        cmds.setAttr(f"{influence_loc}.scaleY", 3.445648364)
        cmds.setAttr(f"{influence_loc}.scaleZ", 3.445648364)
        
        # Connect locator to influence node using separate XYZ attributes
        print(f"Connecting locator to influence node...")
        cmds.connectAttr(f"{influence_loc}.translateX", f"{influence_node.name}.falloffObjectX", force=True)
        cmds.connectAttr(f"{influence_loc}.translateY", f"{influence_node.name}.falloffObjectY", force=True)
        cmds.connectAttr(f"{influence_loc}.translateZ", f"{influence_node.name}.falloffObjectZ", force=True)
        print("Connected locator")
        
        # Add Curve node and configure
        print("Adding Curve node...")
        curve_node = mashNetwork.addNode("MASH_Curve")
        
        # Connect curves to the curve node
        print("Connecting curves...")
        for i, curve in enumerate(curve_list):
            curve_shapes = cmds.listRelatives(curve, shapes=True) or []
            if curve_shapes:
                curve_shape = curve_shapes[0]
                try:
                    print(f"Connecting curve {i}: {curve}")
                    # Print node and curve info for debugging
                    print(f"Curve node: {curve_node.name}")
                    print(f"Curve shape: {curve_shape}")
                    
                    # First curve connects differently
                    if i == 0:
                        cmds.connectAttr(f"{curve_shape}.worldSpace[0]", f"{curve_node.name}.inputCurve", force=True)
                    else:
                        # Enable multi mode before connecting additional curves
                        if i == 1:
                            cmds.setAttr(f"{curve_node.name}.multiCurveMode", 1)
                        # Connect additional curves to multi inputs
                        cmds.connectAttr(f"{curve_shape}.worldSpace[0]", f"{curve_node.name}.multiInputCurve[{i-1}]", force=True)
                except Exception as e:
                    print(f"Error connecting curve {curve}: {str(e)}")
                    
        print(f"MASH network created with {len(curve_list)} curves connected")
        return network_name
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        cmds.error(f"Error creating MASH network: {str(e)}")
        return None
                
create_mash(["pCube1", "curve1", "curve2", "curve3", "curve4", "curve5", "curve6", "curve7"])