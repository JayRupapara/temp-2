import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "sonner";
import { CreditCard, Save, Info, AlertCircle } from "lucide-react";

export default function PaymentSettingsTab({ darkMode }: { darkMode: boolean }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Settings State
  const [codEnabled, setCodEnabled] = useState(true);
  const [codCharge, setCodCharge] = useState(49);
  const [codUnavailableMsg, setCodUnavailableMsg] = useState("Cash on Delivery is temporarily unavailable. Prepaid orders are open and shipping as usual.");
  const [prepaidMsg, setPrepaidMsg] = useState("Prepaid orders are open and shipping as usual.");
  const [saleEnabled, setSaleEnabled] = useState(true);

  const dm = darkMode;
  const bgCard = dm ? "bg-gray-900" : "bg-white";
  const bgInput = dm ? "bg-gray-800" : "bg-gray-50";
  const textMain = dm ? "text-gray-100" : "text-[#3D2B1F]";
  const textSub = dm ? "text-gray-400" : "text-gray-500";
  const border = dm ? "border-gray-800" : "border-gray-200";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const d = await getDoc(doc(db, "settings", "payment"));
        if (d.exists()) {
          const data = d.data();
          if (data.codEnabled !== undefined) setCodEnabled(data.codEnabled);
          if (data.codCharge !== undefined) setCodCharge(data.codCharge);
          if (data.codUnavailableMsg) setCodUnavailableMsg(data.codUnavailableMsg);
          if (data.prepaidMsg) setPrepaidMsg(data.prepaidMsg);
          if (data.saleEnabled !== undefined) setSaleEnabled(data.saleEnabled);
        }
      } catch (err) {
        console.error("Failed to fetch payment settings:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "payment"), {
        codEnabled,
        codCharge,
        codUnavailableMsg,
        prepaidMsg,
        saleEnabled,
        updatedAt: new Date(),
      }, { merge: true });
      toast.success("Payment settings saved successfully!");
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className={`p-8 rounded-2xl ${bgCard} border ${border} flex justify-center items-center h-64`}>
        <div className="w-8 h-8 rounded-full border-4 border-[#CFA18D] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className={`p-6 md:p-8 rounded-2xl ${bgCard} border ${border} shadow-sm max-w-4xl`}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#CFA18D]/10 flex items-center justify-center">
          <CreditCard size={20} className="text-[#CFA18D]" />
        </div>
        <div>
          <h2 className={`text-xl font-bold ${textMain}`}>Site & Payment Settings</h2>
          <p className={`text-xs ${textSub}`}>Configure checkout options and homepage layout</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* COD Toggle */}
        <div className={`p-5 rounded-xl border ${border} ${dm ? 'bg-gray-800/50' : 'bg-gray-50/50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-bold ${textMain} mb-1 flex items-center gap-2`}>
                Cash on Delivery (COD)
                {codEnabled ? (
                  <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                ) : (
                  <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold">DISABLED</span>
                )}
              </h3>
              <p className={`text-xs ${textSub}`}>Enable or disable COD across the entire website.</p>
            </div>
            
            <button 
              onClick={() => setCodEnabled(!codEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${codEnabled ? 'bg-[#059669]' : 'bg-gray-400'}`}
            >
              <div className={`absolute top-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-300 ${codEnabled ? 'left-8' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Sale Section Toggle */}
        <div className={`p-5 rounded-xl border ${border} ${dm ? 'bg-gray-800/50' : 'bg-gray-50/50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-bold ${textMain} mb-1 flex items-center gap-2`}>
                Homepage Sale Section
                {saleEnabled ? (
                  <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                ) : (
                  <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold">DISABLED</span>
                )}
              </h3>
              <p className={`text-xs ${textSub}`}>Show or hide the Rakshabandhan / Festival Sale on the homepage.</p>
            </div>
            
            <button 
              onClick={() => setSaleEnabled(!saleEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${saleEnabled ? 'bg-[#059669]' : 'bg-gray-400'}`}
            >
              <div className={`absolute top-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-300 ${saleEnabled ? 'left-8' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>COD Charge (₹)</label>
            <input 
              type="number"
              value={codCharge}
              onChange={(e) => setCodCharge(Number(e.target.value))}
              disabled={!codEnabled}
              className={`w-full p-3 rounded-xl border ${border} ${bgInput} ${textMain} outline-none focus:ring-2 focus:ring-[#CFA18D] transition-all disabled:opacity-50`}
            />
            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
              <Info size={12} /> Extra fee applied at checkout when COD is selected.
            </p>
          </div>
        </div>

        {/* Messaging */}
        <div className={`p-6 rounded-xl border ${border}`}>
          <h3 className={`font-bold ${textMain} mb-4 flex items-center gap-2`}>
            Checkout & Display Messaging
          </h3>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>COD Unavailable Message</label>
              <textarea 
                value={codUnavailableMsg}
                onChange={(e) => setCodUnavailableMsg(e.target.value)}
                rows={2}
                className={`w-full p-3 rounded-xl border ${border} ${bgInput} ${textMain} outline-none focus:ring-2 focus:ring-[#CFA18D] transition-all resize-none`}
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Shown to customers at checkout when COD is disabled.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Prepaid Orders Message</label>
              <input 
                type="text"
                value={prepaidMsg}
                onChange={(e) => setPrepaidMsg(e.target.value)}
                className={`w-full p-3 rounded-xl border ${border} ${bgInput} ${textMain} outline-none focus:ring-2 focus:ring-[#CFA18D] transition-all`}
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Shown below the unavailability notice to reassure customers.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-md disabled:opacity-70 disabled:hover:scale-100"
            style={{ background: "linear-gradient(135deg, #CFA18D, #A67B66)" }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
