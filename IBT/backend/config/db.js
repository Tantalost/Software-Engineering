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

const cleanupLegacyCollectorIndexes = async () => {
    try {
        const collectorCollection = mongoose.connection.db.collection("collectors");
        const indexes = await collectorCollection.indexes();

        const expectedKey = {
            firstName: 1,
            middleName: 1,
            lastName: 1,
            suffix: 1,
            contactNumber: 1,
        };

        const isExpectedCollectorUniqueIndex = (idx) => {
            if (!idx || idx.unique !== true || !idx.key) return false;
            const keyEntries = Object.entries(idx.key);
            const expectedEntries = Object.entries(expectedKey);
            if (keyEntries.length !== expectedEntries.length) return false;
            return expectedEntries.every(([k, v]) => idx.key[k] === v);
        };

        for (const idx of indexes) {
            if (idx.name === "_id_" || idx.unique !== true) continue;
            if (!isExpectedCollectorUniqueIndex(idx)) {
                await collectorCollection.dropIndex(idx.name);
                console.log(`Removed legacy unique collector index ${idx.name}`);
            }
        }

        const hasExpectedUniqueIndex = indexes.some((idx) =>
            isExpectedCollectorUniqueIndex(idx),
        );

        if (!hasExpectedUniqueIndex) {
            await collectorCollection.createIndex(expectedKey, {
                unique: true,
                name: "firstName_1_middleName_1_lastName_1_suffix_1_contactNumber_1",
            });
            console.log("Created expected unique collector identity index");
        }
    } catch (error) {
        // Ignore when collection/index does not exist yet; surface other issues in logs.
        if (!String(error.message || "").includes("index not found")) {
            console.log("Collector index cleanup warning:", error.message);
        }
    }
};

const connectDB = async ()=>{
    try {
        mongoose.connection.on('connected', ()=>console.log("Database Connected"));
        
        await mongoose.connect(process.env.MONGODB_URL); 
        await cleanupLegacyAdminRoleIndex();
        await cleanupLegacyCollectorIndexes();
        
    } catch (error) {
        console.log(error.message);
    }
}

export default connectDB;