# apps/core/serializers/__init__.py

from .blood_bank import BloodBankSerializer
from .inventory import InventorySerializer
from .emergency_allocation import EmergencyAllocationSerializer, AllocationDetailSerializer
from .hospital import HospitalSerializer
from .demand_history import DemandHistorySerializer

__all__ = [
    'BloodBankSerializer',
    'InventorySerializer',
    'EmergencyAllocationSerializer',
    'AllocationDetailSerializer',
    'HospitalSerializer',
    'DemandHistorySerializer',
]
