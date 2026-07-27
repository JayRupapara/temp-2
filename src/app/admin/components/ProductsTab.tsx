// ── Products Tab (Extracted from App.tsx) ──────────────────────────────────
import { useState } from "react";
import { setDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "sonner";
import { Plus, X, Eye, EyeOff, RefreshCw } from "lucide-react";

type Product = {
  id: number | string; name: string; subtitle: string; description: string;
  price: number; originalPrice: number; category: string; image: string; images?: string[];
  badge: string; badgeColor: string; stock: number; rating: number; reviews: number; care: string;
  isFeatured?: boolean; isBestseller?: boolean; isNewArrival?: boolean; festival?: string; isHidden?: boolean;
  docId?: string;
};

const CLOUDINARY_CLOUD_NAME = "b6vaot45";
const CLOUDINARY_UPLOAD_PRESET = "shrivallabh_upload";

const uploadToCloudinary = async (file: Blob | string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST", body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Cloudinary upload failed");
  return data.secure_url;
};

interface ProductsTabProps {
  products: Product[];
  darkMode: boolean;
}

export default function ProductsTab({ products, darkMode }: ProductsTabProps) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [loading, setLoading] = useState(false);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);

  const bg = darkMode ? "bg-gray-900" : "bg-white";
  const text = darkMode ? "text-gray-100" : "text-gray-900";
  const border = darkMode ? "border-gray-700" : "border-gray-200";
  const inputBg = darkMode ? "bg-gray-800 text-gray-100 border-gray-600" : "border p-2 rounded";

  const handleEdit = (p: Product) => { setEditing(p); setFormData(p); };
  const handleAddNew = () => {
    const newProd: Product = { id: Date.now(), name: "", subtitle: "", description: "", price: 0, originalPrice: 0, category: "Necklace", image: "", badge: "", badgeColor: "#CFA18D", stock: 10, rating: 5, reviews: 0, care: "", isFeatured: false, isBestseller: false, isNewArrival: false, isHidden: false };
    setEditing(newProd); setFormData(newProd);
  };

  const toggleHide = async (p: Product) => {
    try {
      const nextState = !p.isHidden;
      const targetDocId = p.docId || p.id.toString();
      await setDoc(doc(db, "products", targetDocId), { isHidden: nextState }, { merge: true });
      toast.success(nextState ? `"${p.name}" is now hidden` : `"${p.name}" is now visible`);
    } catch (e: any) { toast.error("Failed", { description: e.message }); }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm("Delete this product?")) return;
    try { await deleteDoc(doc(db, "products", id.toString())); toast.success("Product deleted"); }
    catch (e: any) { toast.error("Error", { description: e.message }); }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...(prev.images || [])];
      newImages.splice(index, 1);
      return { ...prev, images: newImages, image: newImages[0] || "" };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, startIndex?: number) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (files.length > 10) return toast.error("Max 10 images at a time");
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (!validFiles.length) return toast.error("Valid image files required.");

    setIsUploadingProduct(true);
    let completedCount = 0;
    const toastId = toast.loading(`Uploading 0/${validFiles.length} images...`);
    const tempUrls = validFiles.map(file => URL.createObjectURL(file));

    setFormData(prev => {
      const newImages = [...(prev.images || [])];
      validFiles.forEach((_, i) => {
        const targetIndex = startIndex !== undefined ? startIndex + i : undefined;
        if (targetIndex !== undefined && targetIndex < 10) newImages[targetIndex] = tempUrls[i];
        else if (newImages.length < 10) newImages.push(tempUrls[i]);
      });
      return { ...prev, images: newImages, image: newImages[0] || prev.image };
    });

    const uploadPromises = validFiles.map((file, i) => {
      return new Promise<void>((resolve, reject) => {
        const tempUrl = tempUrls[i];
        const targetIndex = startIndex !== undefined ? startIndex + i : undefined;
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("No ctx"));
            const MAX_WIDTH = 900;
            let width = img.width; let height = img.height;
            if (width > MAX_WIDTH) { height = height * (MAX_WIDTH / width); width = MAX_WIDTH; }
            canvas.width = width; canvas.height = height;
            ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(async (blob) => {
              if (!blob) return reject(new Error("Empty blob"));
              try {
                const downloadUrl = await uploadToCloudinary(blob);
                setFormData(prev => {
                  const newImages = [...(prev.images || [])];
                  const currentIdx = newImages.indexOf(tempUrl);
                  if (currentIdx !== -1) newImages[currentIdx] = downloadUrl;
                  else if (targetIndex !== undefined && targetIndex < 10) newImages[targetIndex] = downloadUrl;
                  return { ...prev, images: newImages, image: newImages[0] || prev.image };
                });
                completedCount++;
                toast.loading(`Uploading ${completedCount}/${validFiles.length} images...`, { id: toastId });
                resolve();
              } catch (err: any) { toast.error(`Upload Error: ${err.message}`); reject(err); }
            }, "image/jpeg", 0.7);
          } catch (err: any) { reject(err); }
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = tempUrl;
      }).catch(err => {
        setFormData(prev => {
          const newImages = [...(prev.images || [])].filter(img => img !== tempUrls[i]);
          return { ...prev, images: newImages, image: newImages[0] || "" };
        });
      });
    });

    await Promise.all(uploadPromises);
    setIsUploadingProduct(false);
    if (completedCount === validFiles.length) toast.success(`Uploaded ${completedCount} images!`, { id: toastId });
    else toast.error(`Uploaded ${completedCount}/${validFiles.length} images.`, { id: toastId });
  };

  const saveProduct = async () => {
    if (!formData.name || !formData.image) return toast.error("Name and Image required");
    setLoading(true);
    try {
      const cleanData = { ...formData };
      if (cleanData.images && cleanData.images.length > 0) {
        const uploadedImages = await Promise.all(
          cleanData.images.map(async (imgStr) => {
            if (imgStr && imgStr.startsWith("data:image/")) return await uploadToCloudinary(imgStr);
            return imgStr;
          })
        );
        cleanData.images = uploadedImages.filter(img => !!img);
        if (cleanData.images.length > 0) cleanData.image = cleanData.images[0];
      }
      Object.keys(cleanData).forEach(key => (cleanData as any)[key] === undefined && delete (cleanData as any)[key]);
      delete (cleanData as any).docId;
      await setDoc(doc(db, "products", cleanData.id!.toString()), cleanData);
      toast.success("Product saved!");
      setEditing(null);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={handleAddNew} className="px-5 py-2.5 bg-[#CFA18D] text-white rounded-xl font-bold text-sm hover:bg-[#b88e7a] transition-colors">+ Add Product</button>
      </div>
      {editing ? (
        <div className={`${bg} p-6 rounded-2xl shadow-sm border ${border} mb-8`}>
          <h2 className={`text-xl font-bold mb-4 ${text}`}>Edit Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Product Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputBg} />
            <input placeholder="Subtitle" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} className={inputBg} />
            <input type="number" placeholder="Discounted Price" value={formData.price || ''} onChange={e => { const p = Number(e.target.value); setFormData({ ...formData, price: p, originalPrice: p * 2 }); }} className={inputBg} />
            <select value={formData.category || ""} onChange={e => setFormData({ ...formData, category: e.target.value })} className={`${inputBg} bg-white ${darkMode ? 'bg-gray-800' : ''}`}>
              <option value="" disabled>Select Category</option>
              <option value="Necklace">Necklace</option>
              <option value="Bracelet">Bracelet</option>
              <option value="Earrings">Earrings</option>
              <option value="Ring">Ring</option>
              <option value="Mixed">Mixed</option>
            </select>
            <input placeholder="Badge" value={formData.badge} onChange={e => setFormData({ ...formData, badge: e.target.value })} className={inputBg} />

            <div className="col-span-1 md:col-span-2 flex flex-wrap gap-4 py-2 border-y my-2 items-center">
              <label className="flex items-center gap-2 font-bold cursor-pointer text-sm">
                <input type="checkbox" checked={formData.isFeatured || false} onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })} /> Featured
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer text-sm">
                <input type="checkbox" checked={formData.isBestseller || false} onChange={e => setFormData({ ...formData, isBestseller: e.target.checked })} /> Bestseller
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer text-sm">
                <input type="checkbox" checked={formData.isNewArrival || false} onChange={e => setFormData({ ...formData, isNewArrival: e.target.checked })} /> New Arrival
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer text-sm text-amber-700">
                <input type="checkbox" checked={formData.isHidden || false} onChange={e => setFormData({ ...formData, isHidden: e.target.checked })} /> Hidden
              </label>
              <div className="flex items-center gap-2 ml-auto">
                <span className="font-bold text-sm text-[#d9534f]">Festival:</span>
                <select value={formData.festival || ""} onChange={e => setFormData({ ...formData, festival: e.target.value })} className="border border-[#d9534f] p-1.5 text-sm rounded bg-white">
                  <option value="">No Festival</option>
                  <option value="Rakshabandhan">Rakshabandhan</option>
                  <option value="Ganesh Chaturthi">Ganesh Chaturthi</option>
                  <option value="Janmashtami">Janmashtami</option>
                  <option value="Diwali">Diwali</option>
                  <option value="Dhanteras">Dhanteras</option>
                  <option value="Navratri">Navratri</option>
                  <option value="Makar Sankranti">Makar Sankranti</option>
                  <option value="Holi">Holi</option>
                  <option value="Christmas">Christmas</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <input placeholder="Badge Color" value={formData.badgeColor} onChange={e => setFormData({ ...formData, badgeColor: e.target.value })} className={`${inputBg} flex-1`} />
              <div className="w-10 h-10 rounded border" style={{ backgroundColor: formData.badgeColor }} />
            </div>
            <input type="number" placeholder="Stock" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} className={inputBg} />
            <input type="number" placeholder="Rating" step="0.1" value={formData.rating || ''} onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })} className={inputBg} />
            <input type="number" placeholder="Reviews" value={formData.reviews || ''} onChange={e => setFormData({ ...formData, reviews: Number(e.target.value) })} className={inputBg} />
            <div className="col-span-1 md:col-span-2">
              <textarea placeholder="Description" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={`${inputBg} w-full`} />
            </div>
            <div className="col-span-1 md:col-span-2">
              <textarea placeholder="Care Instructions" rows={2} value={formData.care} onChange={e => setFormData({ ...formData, care: e.target.value })} className={`${inputBg} w-full`} />
            </div>
            <div className={`col-span-1 md:col-span-2 border p-4 rounded ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50'} flex flex-col gap-4`}>
              <label className="block text-sm font-bold">Product Images (Up to 10)</label>
              <div className="flex flex-wrap gap-4">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const img = (formData.images || [])[idx] || (idx === 0 ? formData.image : "");
                  return (
                    <div key={idx} className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white overflow-hidden group">
                      {img ? (
                        <>
                          <img src={img} className={`w-full h-full object-cover ${img.startsWith('blob:') ? 'opacity-50 grayscale' : ''}`} />
                          {img.startsWith('blob:') && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <RefreshCw className="w-6 h-6 text-white animate-spin" />
                            </div>
                          )}
                          {!img.startsWith('blob:') && (
                            <button onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><X size={12} className="text-red-500" /></button>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] text-center py-0.5">{idx === 0 ? "Main" : `#${idx}`}</div>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                          <Plus size={16} className="text-gray-400 mb-1" />
                          <span className="text-[9px] text-gray-500 font-medium">{idx === 0 ? "Main" : "Add"}</span>
                          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, idx)} />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={saveProduct} disabled={loading || isUploadingProduct} className={`px-6 py-2 text-white rounded font-bold ${(loading || isUploadingProduct) ? 'bg-gray-400' : 'bg-black'}`}>
              {loading ? "Saving..." : isUploadingProduct ? "Uploading..." : "Save Product"}
            </button>
            <button onClick={() => setEditing(null)} className="px-6 py-2 bg-gray-200 text-black rounded font-bold">Cancel</button>
          </div>
        </div>
      ) : (
        <div className={`${bg} rounded-2xl shadow-sm border ${border} overflow-x-auto`}>
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className={darkMode ? "bg-gray-800 border-b border-gray-700" : "bg-gray-50 border-b"}>
              <tr>
                <th className={`p-4 font-bold ${text}`}>Image</th>
                <th className={`p-4 font-bold ${text}`}>Name</th>
                <th className={`p-4 font-bold ${text}`}>Price</th>
                <th className={`p-4 font-bold ${text}`}>Placements</th>
                <th className={`p-4 font-bold ${text}`}>Status</th>
                <th className={`p-4 font-bold ${text}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...products].sort((a, b) => Number(b.id) - Number(a.id)).map(p => (
                <tr key={p.id} className={`border-b last:border-0 ${darkMode ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50'} ${p.isHidden ? (darkMode ? 'bg-amber-900/10' : 'bg-amber-50/30') : ''}`}>
                  <td className="p-4"><img src={p.image} className="w-12 h-12 rounded object-cover" /></td>
                  <td className={`p-4 font-semibold ${text}`}>{p.name}</td>
                  <td className={`p-4 ${text}`}>₹{p.price}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {p.isFeatured && <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Featured</span>}
                      {p.isBestseller && <span className="text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Bestseller</span>}
                      {p.isNewArrival && <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded">New Arrival</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    {p.isHidden
                      ? <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"><EyeOff size={11} /> Hidden</span>
                      : <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"><Eye size={11} /> Visible</span>}
                  </td>
                  <td className="p-4 flex items-center gap-3">
                    <button onClick={() => toggleHide(p)} title={p.isHidden ? "Show" : "Hide"}
                      className={`font-bold flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-all ${p.isHidden ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-amber-100 text-amber-800 hover:bg-amber-200"}`}>
                      {p.isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                      {p.isHidden ? "Unhide" : "Hide"}
                    </button>
                    <button onClick={() => handleEdit(p)} className="text-blue-600 font-bold hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 font-bold hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
