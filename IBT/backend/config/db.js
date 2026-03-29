import mongoose from "mongoose";

const cleanupLegacyAdminRoleIndex = async () => {
    try {
        const adminCollection = mongoose.connection.db.collection("admins");
        const indexes = await adminCollection.indexes();

        const legacyRoleIndex = indexes.find((idx) => idx.name === "role_1");

        if (
            legacyRoleIndex &&
            legacyRoleIndex.unique === true &&
            legacyRoleIndex.key &&
            Object.keys(legacyRoleIndex.key).length === 1 &&
            legacyRoleIndex.key.role === 1
        ) {
            await adminCollection.dropIndex("role_1");
            console.log("Removed legacy unique index admins.role_1");
        }
    } catch (error) {
        // Ignore when collection/index does not exist yet; surface other issues in logs.
        if (!String(error.message || "").includes("index not found")) {
            console.log("Admin index cleanup warning:", error.message);
        }
    }
};

const connectDB = async ()=>{
    try {
        mongoose.connection.on('connected', ()=>console.log("Database Connected"));
        
        await mongoose.connect(process.env.MONGODB_URL); 
        await cleanupLegacyAdminRoleIndex();
        
    } catch (error) {
        console.log(error.message);
    }
}

export default connectDB;